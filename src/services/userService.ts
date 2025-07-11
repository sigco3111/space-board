import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, FirestoreError, FirestoreErrorCode } from '../types/schema';

// 컬렉션 참조 상수
const USERS_COLLECTION = 'users';

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
 * 사용자 프로필 조회
 * @param uid 사용자 ID
 * @returns 사용자 프로필
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    return withRetry(async () => {
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      return {
        ...userDoc.data(),
        uid: userDoc.id,
      } as UserProfile;
    });
  } catch (error: any) {
    console.error('사용자 프로필 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '사용자 프로필을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 사용자 프로필 생성 또는 업데이트
 * @param user 사용자 프로필 정보
 * @returns 성공 여부
 */
export const createOrUpdateUserProfile = async (
  user: Omit<UserProfile, 'createdAt' | 'lastLogin'>
): Promise<boolean> => {
  try {
    const { uid } = user;
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    return withRetry(async () => {
      // 사용자 존재 여부 확인
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // 기존 사용자인 경우 마지막 로그인 시간만 업데이트
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
        });
      } else {
        // 신규 사용자인 경우 프로필 생성
        await setDoc(userRef, {
          ...user,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      }
      
      return true;
    });
  } catch (error: any) {
    console.error('사용자 프로필 생성/업데이트 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '사용자 프로필을 저장하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 사용자 프로필 업데이트
 * @param uid 사용자 ID
 * @param updates 업데이트할 필드
 * @returns 성공 여부
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'lastLogin'>>
): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    return withRetry(async () => {
      // 사용자 존재 여부 확인
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '사용자 프로필을 찾을 수 없습니다.'
        );
      }
      
      // 프로필 업데이트
      await updateDoc(userRef, updates);
      
      return true;
    });
  } catch (error: any) {
    console.error('사용자 프로필 업데이트 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '사용자 프로필을 업데이트하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 익명 사용자를 정식 사용자로 변환
 * @param anonymousUid 익명 사용자 ID
 * @param user 정식 사용자 정보
 * @returns 성공 여부
 */
export const convertAnonymousUser = async (
  anonymousUid: string,
  user: Omit<UserProfile, 'createdAt' | 'lastLogin'>
): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, anonymousUid);
    
    return withRetry(async () => {
      // 익명 사용자 존재 여부 확인
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '사용자 프로필을 찾을 수 없습니다.'
        );
      }
      
      // 기존 생성 시간 유지
      const { createdAt } = userDoc.data();
      
      // 프로필 업데이트
      await updateDoc(userRef, {
        ...user,
        isAnonymous: false,
        lastLogin: serverTimestamp(),
        createdAt, // 기존 생성 시간 유지
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('익명 사용자 변환 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '익명 사용자를 변환하는 중 오류가 발생했습니다.'
    );
  }
}; 