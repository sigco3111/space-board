import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth';
import type { User as FirebaseUser, UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import type { User } from '../types';

/**
 * Firebase 사용자 정보를 애플리케이션 사용자 타입으로 변환
 * @param firebaseUser Firebase 사용자 객체
 * @returns 변환된 사용자 객체
 */
const mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Firestore에서 추가 사용자 정보 가져오기
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const userData = userDoc.data();
  
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    isAnonymous: firebaseUser.isAnonymous,
    createdAt: userData?.createdAt?.toDate() || new Date(),
    lastLogin: userData?.lastLogin?.toDate() || new Date(),
  };
};

/**
 * 이메일과 비밀번호로 회원가입
 * @param email 이메일
 * @param password 비밀번호
 * @param displayName 표시 이름
 * @returns 사용자 정보
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    // 이메일/비밀번호로 회원가입
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 사용자 프로필 업데이트
    await updateProfile(userCredential.user, { displayName });

    // Firestore에 사용자 정보 저장
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName,
      isAnonymous: false,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    return mapFirebaseUserToUser(userCredential.user);
  } catch (error: any) {
    // 에러 처리
    const errorCode = error.code;
    let errorMessage = '회원가입 중 오류가 발생했습니다.';
    
    switch (errorCode) {
      case 'auth/email-already-in-use':
        errorMessage = '이미 사용 중인 이메일 주소입니다.';
        break;
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일 주소입니다.';
        break;
      case 'auth/weak-password':
        errorMessage = '비밀번호가 너무 약합니다.';
        break;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 이메일과 비밀번호로 로그인
 * @param email 이메일
 * @param password 비밀번호
 * @returns 사용자 정보
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    // 이메일/비밀번호로 로그인
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Firestore에 마지막 로그인 시간 업데이트
    await setDoc(
      doc(db, 'users', userCredential.user.uid),
      { lastLogin: serverTimestamp() },
      { merge: true }
    );

    return mapFirebaseUserToUser(userCredential.user);
  } catch (error: any) {
    // 에러 처리
    const errorCode = error.code;
    let errorMessage = '로그인 중 오류가 발생했습니다.';
    
    switch (errorCode) {
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일 주소입니다.';
        break;
      case 'auth/user-disabled':
        errorMessage = '계정이 비활성화되었습니다.';
        break;
      case 'auth/user-not-found':
        errorMessage = '사용자를 찾을 수 없습니다.';
        break;
      case 'auth/wrong-password':
        errorMessage = '잘못된 비밀번호입니다.';
        break;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Google 계정으로 로그인
 * @returns 사용자 정보
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    // Google 로그인 팝업 표시
    const userCredential: UserCredential = await signInWithPopup(auth, googleProvider);

    // Firestore에 사용자 정보 저장 또는 업데이트
    await setDoc(
      doc(db, 'users', userCredential.user.uid),
      {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        isAnonymous: false,
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );

    // 사용자 정보가 이미 존재하는지 확인
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      // 새 사용자인 경우 createdAt 필드 추가
      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        { createdAt: serverTimestamp() },
        { merge: true }
      );
    }

    return mapFirebaseUserToUser(userCredential.user);
  } catch (error: any) {
    // 에러 처리
    throw new Error('Google 로그인 중 오류가 발생했습니다.');
  }
};

/**
 * 익명으로 로그인
 * @returns 사용자 정보
 */
export const loginAnonymously = async (): Promise<User> => {
  try {
    // 익명 로그인
    const userCredential: UserCredential = await signInAnonymously(auth);

    // Firestore에 익명 사용자 정보 저장
    await setDoc(
      doc(db, 'users', userCredential.user.uid),
      {
        isAnonymous: true,
        displayName: '익명 사용자',
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );

    // 사용자 정보가 이미 존재하는지 확인
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      // 새 사용자인 경우 createdAt 필드 추가
      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        { createdAt: serverTimestamp() },
        { merge: true }
      );
    }

    return mapFirebaseUserToUser(userCredential.user);
  } catch (error: any) {
    // 에러 처리
    throw new Error('익명 로그인 중 오류가 발생했습니다.');
  }
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error('로그아웃 중 오류가 발생했습니다.');
  }
};

/**
 * 비밀번호 재설정 이메일 발송
 * @param email 이메일
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    // 에러 처리
    const errorCode = error.code;
    let errorMessage = '비밀번호 재설정 중 오류가 발생했습니다.';
    
    switch (errorCode) {
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일 주소입니다.';
        break;
      case 'auth/user-not-found':
        errorMessage = '해당 이메일로 등록된 사용자가 없습니다.';
        break;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 현재 로그인한 사용자 정보 가져오기
 * @returns 사용자 정보 또는 null
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  
  return mapFirebaseUserToUser(currentUser);
}; 