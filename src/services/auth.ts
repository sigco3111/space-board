/**
 * 인증 관련 기능을 처리하는 서비스
 * 구글 로그인 및 익명 로그인을 지원합니다.
 */
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { auth } from './firebase';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

// 사용자 정보 인터페이스 정의
export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

/**
 * Firebase 인증 에러 타입 가드
 */
function isFirebaseAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'code' in error && 
    typeof (error as any).code === 'string'
  );
}

/**
 * 구글 로그인을 처리하는 함수
 * 로그인 성공 시 사용자 정보 반환, 실패 시 에러 발생
 */
export const signInWithGoogle = async (): Promise<UserData> => {
  try {
    console.log("구글 로그인 시도 중...");
    
    // 구글 인증 제공자 생성
    const provider = new GoogleAuthProvider();
    
    // 구글 로그인 팝업 표시
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    console.log("구글 로그인 성공:", user.uid);
    
    // 사용자 정보를 Firestore에 저장
    try {
      await saveUserToFirestore(user);
    } catch (saveError) {
      console.warn("사용자 정보 저장 실패, 로그인은 계속 진행:", saveError);
    }
    
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      isAnonymous: false
    };
  } catch (error) {
    console.error('구글 로그인 중 오류 발생:', error);
    
    // 오류 타입 확인
    if (isFirebaseAuthError(error)) {
      // 사용자가 로그인을 취소한 경우 다른 오류 메시지 표시
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('로그인이 취소되었습니다. 다시 시도해 주세요.');
      }
      
      // Firebase 연결 오류인 경우 네트워크 문제 메시지 표시
      if (error.code === 'auth/network-request-failed') {
        throw new Error('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해 주세요.');
      }
    }
    
    throw new Error('구글 로그인에 실패했습니다. 다시 시도해 주세요.');
  }
};

/**
 * 익명 로그인을 처리하는 함수
 * 로그인 성공 시 사용자 정보 반환, 실패 시 에러 발생
 */
export const signInAsAnonymous = async (): Promise<UserData> => {
  try {
    console.log("익명 로그인 시도 중...");
    
    // 익명 로그인 처리
    const result = await signInAnonymously(auth);
    const user = result.user;
    
    console.log("익명 로그인 성공:", user.uid);
    
    // 익명 사용자 정보를 Firestore에 저장
    try {
      await saveUserToFirestore(user);
    } catch (saveError) {
      console.warn("사용자 정보 저장 실패, 로그인은 계속 진행:", saveError);
    }
    
    return {
      uid: user.uid,
      displayName: '익명 사용자',
      email: null,
      photoURL: null,
      isAnonymous: true
    };
  } catch (error) {
    console.error('익명 로그인 중 오류 발생:', error);
    
    // 오류 타입 확인
    if (isFirebaseAuthError(error)) {
      // Firebase 연결 오류인 경우 네트워크 문제 메시지 표시
      if (error.code === 'auth/network-request-failed') {
        throw new Error('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해 주세요.');
      }
    }
    
    throw new Error('익명 로그인에 실패했습니다. 다시 시도해 주세요.');
  }
};

/**
 * 로그아웃 처리 함수
 */
export const signOut = async (): Promise<void> => {
  try {
    console.log("로그아웃 시도 중...");
    await firebaseSignOut(auth);
    console.log("로그아웃 성공");
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error);
    throw new Error('로그아웃에 실패했습니다.');
  }
};

/**
 * 사용자 인증 상태 변경 리스너 설정 함수
 * @param callback 인증 상태 변경 시 호출될 콜백 함수
 */
export const onAuthChange = (callback: (user: UserData | null) => void): (() => void) => {
  console.log("인증 상태 변경 리스너 설정 중...");
  
  // 인증 상태 변경 리스너 설정
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // 로그인 상태
      const userData: UserData = {
        uid: user.uid,
        displayName: user.isAnonymous ? '익명 사용자' : user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous
      };
      console.log("인증 상태 변경: 로그인됨", user.uid);
      callback(userData);
    } else {
      // 로그아웃 상태
      console.log("인증 상태 변경: 로그아웃됨");
      callback(null);
    }
  });
};

/**
 * 현재 로그인한 사용자 정보 반환 함수
 */
export const getCurrentUser = (): UserData | null => {
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }
  
  return {
    uid: user.uid,
    displayName: user.isAnonymous ? '익명 사용자' : user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous
  };
};

/**
 * 사용자 정보를 Firestore에 저장하는 함수
 * @param user 저장할 사용자 정보
 */
const saveUserToFirestore = async (user: User): Promise<void> => {
  try {
    console.log("사용자 정보 Firestore에 저장 중...", user.uid);
    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);
    
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.isAnonymous ? '익명 사용자' : user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous
    }, { merge: true });
    
    console.log("사용자 정보 저장 완료");
  } catch (error) {
    console.error('사용자 정보 저장 중 오류 발생:', error);
    // 사용자 정보 저장 실패해도 로그인은 계속 진행
    throw error;
  }
}; 