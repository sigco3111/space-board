import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { Bookmark, Post, QueryOptions, FirestoreError, FirestoreErrorCode } from '../types/schema';

// 컬렉션 참조 상수
const BOOKMARKS_COLLECTION = 'bookmarks';
const POSTS_COLLECTION = 'posts';

// 최대 재시도 횟수
const MAX_RETRY_COUNT = 3;

/**
 * 재시도 로직이 포함된 비동기 함수 실행 헬퍼
 * @param fn 실행할 비동기 함수
 * @param retries 남은 재시도 횟수
 * @param delay 재시도 간 지연 시간 (ms)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRY_COUNT,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) {
      throw error;
    }

    // 일시적인 오류인 경우에만 재시도
    if (
      error.code === 'unavailable' ||
      error.code === 'resource-exhausted' ||
      error.code === 'deadline-exceeded'
    ) {
      console.log(`재시도 중... 남은 횟수: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2); // 지수 백오프
    }

    throw error;
  }
}

/**
 * 사용자의 북마크 목록 조회
 * @param userId 사용자 ID
 * @param options 쿼리 옵션
 * @returns 북마크 목록
 */
export const getBookmarksByUserId = async (
  userId: string,
  options: QueryOptions = {}
): Promise<Bookmark[]> => {
  try {
    const bookmarksRef = collection(db, BOOKMARKS_COLLECTION);
    
    // 쿼리 빌더
    let q = query(bookmarksRef, where('userId', '==', userId));
    
    // 정렬 옵션 적용
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    } else {
      // 기본 정렬: 생성일 기준 내림차순 (최신 북마크부터)
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    // 페이지네이션 시작점 적용
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }
    
    // 조회 수 제한 적용
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    // 쿼리 실행
    return withRetry(async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as Bookmark));
    });
  } catch (error: any) {
    console.error('북마크 목록 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '북마크 목록을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 사용자의 북마크한 게시물 목록 조회
 * @param userId 사용자 ID
 * @param options 쿼리 옵션
 * @returns 북마크한 게시물 목록
 */
export const getBookmarkedPostsByUserId = async (
  userId: string,
  options: QueryOptions = {}
): Promise<Post[]> => {
  try {
    // 사용자의 북마크 목록 조회
    const bookmarks = await getBookmarksByUserId(userId, options);
    
    // 북마크가 없는 경우 빈 배열 반환
    if (bookmarks.length === 0) {
      return [];
    }
    
    // 북마크한 게시물 ID 목록 추출
    const postIds = bookmarks.map(bookmark => bookmark.postId);
    
    // 게시물 정보 조회 (여러 번의 쿼리 필요)
    return withRetry(async () => {
      const posts: Post[] = [];
      
      // 각 게시물 ID에 대해 정보 조회
      for (const postId of postIds) {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
          posts.push({
            ...postDoc.data(),
            id: postDoc.id,
          } as Post);
        }
      }
      
      // 북마크 순서대로 정렬
      return posts.sort((a, b) => {
        const aIndex = postIds.indexOf(a.id);
        const bIndex = postIds.indexOf(b.id);
        return aIndex - bIndex;
      });
    });
  } catch (error: any) {
    console.error('북마크한 게시물 목록 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '북마크한 게시물 목록을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 게시물 북마크 여부 확인
 * @param userId 사용자 ID
 * @param postId 게시물 ID
 * @returns 북마크 여부 및 북마크 ID
 */
export const checkBookmark = async (
  userId: string,
  postId: string
): Promise<{ isBookmarked: boolean; bookmarkId?: string }> => {
  try {
    const bookmarksRef = collection(db, BOOKMARKS_COLLECTION);
    const q = query(
      bookmarksRef,
      where('userId', '==', userId),
      where('postId', '==', postId)
    );
    
    return withRetry(async () => {
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { isBookmarked: false };
      }
      
      return {
        isBookmarked: true,
        bookmarkId: snapshot.docs[0].id,
      };
    });
  } catch (error: any) {
    console.error('북마크 확인 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '북마크 확인 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 게시물 북마크 추가
 * @param userId 사용자 ID
 * @param postId 게시물 ID
 * @returns 생성된 북마크 ID
 */
export const addBookmark = async (
  userId: string,
  postId: string
): Promise<string> => {
  try {
    return withRetry(async () => {
      // 게시물 존재 여부 확인
      const postRef = doc(db, POSTS_COLLECTION, postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '게시물을 찾을 수 없습니다.'
        );
      }
      
      // 이미 북마크한 게시물인지 확인
      const { isBookmarked } = await checkBookmark(userId, postId);
      
      if (isBookmarked) {
        throw new FirestoreError(
          FirestoreErrorCode.ALREADY_EXISTS,
          '이미 북마크한 게시물입니다.'
        );
      }
      
      // 북마크 생성
      const newBookmark: Omit<Bookmark, 'id'> = {
        userId,
        postId,
        createdAt: serverTimestamp() as any,
      };
      
      const docRef = await addDoc(collection(db, BOOKMARKS_COLLECTION), newBookmark);
      return docRef.id;
    });
  } catch (error: any) {
    console.error('북마크 추가 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '북마크를 추가하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 게시물 북마크 삭제
 * @param userId 사용자 ID
 * @param postId 게시물 ID
 * @returns 성공 여부
 */
export const removeBookmark = async (
  userId: string,
  postId: string
): Promise<boolean> => {
  try {
    return withRetry(async () => {
      // 북마크 확인
      const { isBookmarked, bookmarkId } = await checkBookmark(userId, postId);
      
      if (!isBookmarked || !bookmarkId) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '북마크를 찾을 수 없습니다.'
        );
      }
      
      // 북마크 삭제
      const bookmarkRef = doc(db, BOOKMARKS_COLLECTION, bookmarkId);
      await deleteDoc(bookmarkRef);
      
      return true;
    });
  } catch (error: any) {
    console.error('북마크 삭제 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '북마크를 삭제하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 북마크 토글 (추가/삭제)
 * @param userId 사용자 ID
 * @param postId 게시물 ID
 * @returns 북마크 상태 및 ID
 */
export const toggleBookmark = async (
  userId: string,
  postId: string
): Promise<{ isBookmarked: boolean; bookmarkId?: string }> => {
  try {
    return withRetry(async () => {
      // 현재 북마크 상태 확인
      const { isBookmarked, bookmarkId } = await checkBookmark(userId, postId);
      
      if (isBookmarked && bookmarkId) {
        // 북마크가 있으면 삭제
        await removeBookmark(userId, postId);
        return { isBookmarked: false };
      } else {
        // 북마크가 없으면 추가
        const newBookmarkId = await addBookmark(userId, postId);
        return { isBookmarked: true, bookmarkId: newBookmarkId };
      }
    });
  } catch (error: any) {
    console.error('북마크 토글 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '북마크 상태를 변경하는 중 오류가 발생했습니다.'
    );
  }
}; 