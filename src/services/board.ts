import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import type { Board, BoardItem } from '../types';

/**
 * Firestore 문서를 애플리케이션 타입으로 변환
 * @param doc Firestore 문서
 * @returns 변환된 객체
 */
const convertFirestoreDoc = <T>(doc: any): T => {
  const data = doc.data();
  
  // Timestamp 객체를 Date 객체로 변환
  const converted: any = { ...data, id: doc.id };
  
  // 날짜 필드 변환
  if (data.createdAt instanceof Timestamp) {
    converted.createdAt = data.createdAt.toDate();
  }
  if (data.updatedAt instanceof Timestamp) {
    converted.updatedAt = data.updatedAt.toDate();
  }
  
  // 중첩된 아이템의 날짜 필드도 변환
  if (data.items && Array.isArray(data.items)) {
    converted.items = data.items.map((item: any) => {
      const convertedItem = { ...item };
      if (item.createdAt instanceof Timestamp) {
        convertedItem.createdAt = item.createdAt.toDate();
      }
      if (item.updatedAt instanceof Timestamp) {
        convertedItem.updatedAt = item.updatedAt.toDate();
      }
      return convertedItem;
    });
  }
  
  return converted as T;
};

/**
 * 사용자의 모든 보드 가져오기
 * @param userId 사용자 ID
 * @returns 보드 목록
 */
export const getUserBoards = async (userId: string): Promise<Board[]> => {
  try {
    const q = query(
      collection(db, 'boards'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const boards: Board[] = [];
    
    querySnapshot.forEach((doc) => {
      boards.push(convertFirestoreDoc<Board>(doc));
    });
    
    return boards;
  } catch (error: any) {
    throw new Error('보드 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 보드 상세 정보 가져오기
 * @param boardId 보드 ID
 * @returns 보드 정보
 */
export const getBoardById = async (boardId: string): Promise<Board> => {
  try {
    const docRef = doc(db, 'boards', boardId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('보드를 찾을 수 없습니다.');
    }
    
    return convertFirestoreDoc<Board>(docSnap);
  } catch (error: any) {
    throw new Error('보드 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 새 보드 생성
 * @param userId 사용자 ID
 * @param title 보드 제목
 * @param description 보드 설명
 * @returns 생성된 보드 정보
 */
export const createBoard = async (
  userId: string,
  title: string,
  description: string = '',
  isPublic: boolean = false
): Promise<Board> => {
  try {
    const newBoard = {
      userId,
      title,
      description,
      isPublic,
      items: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'boards'), newBoard);
    
    // 생성된 보드 정보 가져오기
    return getBoardById(docRef.id);
  } catch (error: any) {
    throw new Error('보드 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 보드 정보 업데이트
 * @param boardId 보드 ID
 * @param updates 업데이트할 필드
 * @returns 업데이트된 보드 정보
 */
export const updateBoard = async (
  boardId: string,
  updates: Partial<Omit<Board, 'id' | 'userId' | 'createdAt' | 'items'>>
): Promise<Board> => {
  try {
    const docRef = doc(db, 'boards', boardId);
    
    // 업데이트 시간 추가
    const updatedFields = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, updatedFields);
    
    // 업데이트된 보드 정보 가져오기
    return getBoardById(boardId);
  } catch (error: any) {
    throw new Error('보드 업데이트 중 오류가 발생했습니다.');
  }
};

/**
 * 보드 삭제
 * @param boardId 보드 ID
 */
export const deleteBoard = async (boardId: string): Promise<void> => {
  try {
    // 보드 정보 가져오기
    const board = await getBoardById(boardId);
    
    // 보드에 포함된 이미지 아이템의 스토리지 파일 삭제
    const imageItems = board.items.filter(item => item.type === 'image');
    for (const item of imageItems) {
      if (item.content.startsWith('gs://') || item.content.startsWith('https://firebasestorage.googleapis.com')) {
        try {
          const storageRef = ref(storage, item.content);
          await deleteObject(storageRef);
        } catch (error) {
          console.error('이미지 파일 삭제 중 오류:', error);
          // 이미지 삭제 실패해도 보드 삭제는 계속 진행
        }
      }
    }
    
    // 보드 문서 삭제
    await deleteDoc(doc(db, 'boards', boardId));
  } catch (error: any) {
    throw new Error('보드 삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 보드에 아이템 추가
 * @param boardId 보드 ID
 * @param item 추가할 아이템
 * @returns 추가된 아이템 ID
 */
export const addItemToBoard = async (
  boardId: string,
  item: Omit<BoardItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    // 보드 정보 가져오기
    const board = await getBoardById(boardId);
    
    // 새 아이템 생성
    const newItem: BoardItem = {
      ...item,
      id: crypto.randomUUID(), // 고유 ID 생성
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // 아이템 추가 및 보드 업데이트
    const updatedItems = [...board.items, newItem];
    
    await updateDoc(doc(db, 'boards', boardId), {
      items: updatedItems,
      updatedAt: serverTimestamp(),
    });
    
    return newItem.id;
  } catch (error: any) {
    throw new Error('아이템 추가 중 오류가 발생했습니다.');
  }
};

/**
 * 보드의 아이템 업데이트
 * @param boardId 보드 ID
 * @param itemId 아이템 ID
 * @param updates 업데이트할 필드
 */
export const updateBoardItem = async (
  boardId: string,
  itemId: string,
  updates: Partial<Omit<BoardItem, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    // 보드 정보 가져오기
    const board = await getBoardById(boardId);
    
    // 업데이트할 아이템 찾기
    const itemIndex = board.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('아이템을 찾을 수 없습니다.');
    }
    
    // 아이템 업데이트
    const updatedItem = {
      ...board.items[itemIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    const updatedItems = [...board.items];
    updatedItems[itemIndex] = updatedItem;
    
    // 보드 업데이트
    await updateDoc(doc(db, 'boards', boardId), {
      items: updatedItems,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('아이템 업데이트 중 오류가 발생했습니다.');
  }
};

/**
 * 보드에서 아이템 삭제
 * @param boardId 보드 ID
 * @param itemId 아이템 ID
 */
export const deleteBoardItem = async (
  boardId: string,
  itemId: string
): Promise<void> => {
  try {
    // 보드 정보 가져오기
    const board = await getBoardById(boardId);
    
    // 삭제할 아이템 찾기
    const item = board.items.find(item => item.id === itemId);
    if (!item) {
      throw new Error('아이템을 찾을 수 없습니다.');
    }
    
    // 이미지 아이템인 경우 스토리지 파일 삭제
    if (item.type === 'image' && (item.content.startsWith('gs://') || item.content.startsWith('https://firebasestorage.googleapis.com'))) {
      try {
        const storageRef = ref(storage, item.content);
        await deleteObject(storageRef);
      } catch (error) {
        console.error('이미지 파일 삭제 중 오류:', error);
        // 이미지 삭제 실패해도 아이템 삭제는 계속 진행
      }
    }
    
    // 아이템 삭제
    const updatedItems = board.items.filter(item => item.id !== itemId);
    
    // 보드 업데이트
    await updateDoc(doc(db, 'boards', boardId), {
      items: updatedItems,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('아이템 삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 이미지 업로드 및 아이템 추가
 * @param boardId 보드 ID
 * @param userId 사용자 ID
 * @param file 이미지 파일
 * @param position 위치
 * @param metadata 메타데이터
 * @returns 추가된 아이템 ID
 */
export const uploadImageAndAddToBoard = async (
  boardId: string,
  userId: string,
  file: File,
  position: { x: number; y: number; z: number },
  metadata: { width: number; height: number; alt?: string }
): Promise<string> => {
  try {
    // 스토리지 경로 설정
    const filePath = `images/${userId}/${boardId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    
    // 이미지 업로드
    await uploadBytes(storageRef, file);
    
    // 업로드된 이미지 URL 가져오기
    const downloadURL = await getDownloadURL(storageRef);
    
    // 보드에 이미지 아이템 추가
    const imageItem: Omit<BoardItem, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      type: 'image',
      content: downloadURL,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      metadata,
    };
    
    return addItemToBoard(boardId, imageItem);
  } catch (error: any) {
    throw new Error('이미지 업로드 중 오류가 발생했습니다.');
  }
}; 