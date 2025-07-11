import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Settings, FirestoreError, FirestoreErrorCode } from '../types/schema';

// 컬렉션 및 문서 참조 상수
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global-settings';

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
 * 전역 설정 조회
 * @returns 전역 설정 정보
 */
export const getGlobalSettings = async (): Promise<Settings> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    return withRetry(async () => {
      const settingsDoc = await getDoc(settingsRef);
      
      if (!settingsDoc.exists()) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '설정 정보를 찾을 수 없습니다.'
        );
      }
      
      return {
        ...settingsDoc.data(),
        id: settingsDoc.id,
      } as Settings;
    });
  } catch (error: any) {
    console.error('전역 설정 조회 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '설정 정보를 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 전역 설정 초기화 (애플리케이션 최초 실행 시 호출)
 * @returns 초기화된 설정 정보
 */
export const initializeGlobalSettings = async (): Promise<Settings> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    return withRetry(async () => {
      // 이미 설정이 존재하는지 확인
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return {
          ...settingsDoc.data(),
          id: settingsDoc.id,
        } as Settings;
      }
      
      // 기본 설정 생성
      const defaultSettings: Omit<Settings, 'id'> = {
        categories: [
          { id: 'all', name: '전체' },
          { id: 'tech', name: '기술' },
          { id: 'general', name: '일반' },
        ],
        allowAnonymousPosting: true,
        allowComments: true,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };
      
      // 설정 저장
      await setDoc(settingsRef, defaultSettings);
      
      return {
        ...defaultSettings,
        id: GLOBAL_SETTINGS_ID,
      } as Settings;
    });
  } catch (error: any) {
    console.error('전역 설정 초기화 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '설정 정보를 초기화하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 카테고리 목록 조회
 * @returns 카테고리 목록
 */
export const getCategories = async (): Promise<Settings['categories']> => {
  try {
    const settings = await getGlobalSettings();
    return settings.categories;
  } catch (error: any) {
    console.error('카테고리 목록 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '카테고리 목록을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 카테고리 추가
 * @param categoryId 카테고리 ID
 * @param categoryName 카테고리 이름
 * @returns 성공 여부
 */
export const addCategory = async (
  categoryId: string,
  categoryName: string
): Promise<boolean> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    return withRetry(async () => {
      // 현재 설정 정보 조회
      const settings = await getGlobalSettings();
      
      // 이미 존재하는 카테고리인지 확인
      const existingCategory = settings.categories.find(cat => cat.id === categoryId);
      
      if (existingCategory) {
        throw new FirestoreError(
          FirestoreErrorCode.ALREADY_EXISTS,
          '이미 존재하는 카테고리입니다.'
        );
      }
      
      // 카테고리 추가
      const updatedCategories = [
        ...settings.categories,
        { id: categoryId, name: categoryName },
      ];
      
      // 설정 업데이트
      await updateDoc(settingsRef, {
        categories: updatedCategories,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('카테고리 추가 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '카테고리를 추가하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 카테고리 수정
 * @param categoryId 카테고리 ID
 * @param categoryName 새 카테고리 이름
 * @returns 성공 여부
 */
export const updateCategory = async (
  categoryId: string,
  categoryName: string
): Promise<boolean> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    return withRetry(async () => {
      // 현재 설정 정보 조회
      const settings = await getGlobalSettings();
      
      // 카테고리 존재 여부 확인
      const categoryIndex = settings.categories.findIndex(cat => cat.id === categoryId);
      
      if (categoryIndex === -1) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '카테고리를 찾을 수 없습니다.'
        );
      }
      
      // 카테고리 수정
      const updatedCategories = [...settings.categories];
      updatedCategories[categoryIndex] = { id: categoryId, name: categoryName };
      
      // 설정 업데이트
      await updateDoc(settingsRef, {
        categories: updatedCategories,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('카테고리 수정 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '카테고리를 수정하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 카테고리 삭제
 * @param categoryId 카테고리 ID
 * @returns 성공 여부
 */
export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    return withRetry(async () => {
      // 현재 설정 정보 조회
      const settings = await getGlobalSettings();
      
      // 'all' 카테고리는 삭제 불가
      if (categoryId === 'all') {
        throw new FirestoreError(
          FirestoreErrorCode.PERMISSION_DENIED,
          '기본 카테고리는 삭제할 수 없습니다.'
        );
      }
      
      // 카테고리 존재 여부 확인
      const categoryIndex = settings.categories.findIndex(cat => cat.id === categoryId);
      
      if (categoryIndex === -1) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '카테고리를 찾을 수 없습니다.'
        );
      }
      
      // 카테고리 삭제
      const updatedCategories = settings.categories.filter(cat => cat.id !== categoryId);
      
      // 설정 업데이트
      await updateDoc(settingsRef, {
        categories: updatedCategories,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('카테고리 삭제 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '카테고리를 삭제하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 익명 게시물 허용 여부 설정
 * @param allow 허용 여부
 * @returns 성공 여부
 */
export const setAllowAnonymousPosting = async (allow: boolean): Promise<boolean> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    return withRetry(async () => {
      // 설정 업데이트
      await updateDoc(settingsRef, {
        allowAnonymousPosting: allow,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('익명 게시물 설정 변경 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '익명 게시물 설정을 변경하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 댓글 허용 여부 설정
 * @param allow 허용 여부
 * @returns 성공 여부
 */
export const setAllowComments = async (allow: boolean): Promise<boolean> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    return withRetry(async () => {
      // 설정 업데이트
      await updateDoc(settingsRef, {
        allowComments: allow,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('댓글 설정 변경 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '댓글 설정을 변경하는 중 오류가 발생했습니다.'
    );
  }
}; 