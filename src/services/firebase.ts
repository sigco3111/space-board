// Firebase 설정 및 초기화
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

// 개발 모드 여부 확인
const isDevelopment = import.meta.env.MODE === 'development';

// Firebase 설정 정보
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// 필수 환경변수 확인
const missingEnvVars: string[] = [];
if (!firebaseConfig.apiKey) missingEnvVars.push('VITE_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain) missingEnvVars.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missingEnvVars.push('VITE_FIREBASE_PROJECT_ID');
if (!firebaseConfig.appId) missingEnvVars.push('VITE_FIREBASE_APP_ID');

if (missingEnvVars.length > 0) {
  const errorMessage = `Firebase 설정 오류: 다음 환경변수가 설정되지 않았습니다: ${missingEnvVars.join(', ')}. .env 파일을 확인하세요.`;
  if (isDevelopment) {
    console.error(errorMessage);
    console.info('참고: .env.example 파일을 .env로 복사하고 Firebase 콘솔에서 프로젝트 설정 값을 추가하세요.');
  }
}

// Firebase 설정 정보 디버깅 로그
console.log('Firebase 설정 정보:', {
  apiKeyExists: !!firebaseConfig.apiKey,
  authDomainExists: !!firebaseConfig.authDomain,
  projectIdExists: !!firebaseConfig.projectId,
  appIdExists: !!firebaseConfig.appId,
  storageBucketExists: !!firebaseConfig.storageBucket,
  messagingSenderIdExists: !!firebaseConfig.messagingSenderId
});

// 재시도 설정
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 1000; // 1초

/**
 * 지연 함수 - 지정된 시간(ms) 동안 대기
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Firebase 초기화 결과 인터페이스 정의
interface FirebaseInitResult {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

/**
 * Firebase 초기화 함수 - 재시도 로직 포함
 */
const initializeFirebase = async (): Promise<FirebaseInitResult> => {
  let app: FirebaseApp;
  let auth: Auth;
  let db: Firestore;
  let retryCount = 0;
  let lastError: unknown = null;

  while (retryCount < MAX_RETRY_COUNT) {
    try {
      console.log(`Firebase 초기화 시도 중... (시도 ${retryCount + 1}/${MAX_RETRY_COUNT})`);
      
      // Firebase 앱 초기화
      app = initializeApp(firebaseConfig);
      console.log("Firebase 앱 초기화 성공");
      
      // Firebase 인증 초기화
      auth = getAuth(app);
      console.log("Firebase 인증 초기화 성공:", auth.currentUser ? '사용자 있음' : '사용자 없음');
      
      // Firestore 초기화
      db = getFirestore(app);
      console.log("Firestore 초기화 성공");
      
      // 초기화 성공하면 반복문 종료
      return { app, auth, db };
    } catch (error) {
      lastError = error;
      console.error(`Firebase 초기화 실패 (시도 ${retryCount + 1}/${MAX_RETRY_COUNT}):`, error);
      retryCount++;
      
      if (retryCount < MAX_RETRY_COUNT) {
        console.log(`${RETRY_DELAY}ms 후 재시도...`);
        await delay(RETRY_DELAY);
      }
    }
  }
  
  console.error(`Firebase 초기화 최종 실패 (${MAX_RETRY_COUNT}회 시도 후):`, lastError);
  
  // 더미 객체로 대체하여 앱이 최소한 실행되게 함
  app = { name: 'dummy-app' } as FirebaseApp;
  auth = { 
    currentUser: null, 
    onAuthStateChanged: (callback: (user: null) => void) => { callback(null); return () => {}; }
  } as unknown as Auth;
  db = { 
    collection: () => ({ 
      doc: () => ({ 
        get: async () => ({ exists: () => false }) 
      }) 
    }) 
  } as unknown as Firestore;
  
  return { app, auth, db };
};

// Firebase 초기화 실행 및 객체 생성
const dummyApp = { name: 'initializing' } as FirebaseApp;
const dummyAuth = { currentUser: null } as unknown as Auth;
const dummyDb = {} as unknown as Firestore;

// Firebase 객체 초기값 설정
let app: FirebaseApp = dummyApp;
let auth: Auth = dummyAuth;
let db: Firestore = dummyDb;

// 즉시 실행 함수를 사용하여 초기화
(async () => {
  const result = await initializeFirebase();
  app = result.app;
  auth = result.auth;
  db = result.db;
  console.log("Firebase 초기화 완료");
})().catch(error => {
  console.error("Firebase 초기화 과정에서 예상치 못한 오류 발생:", error);
});

/**
 * Firebase 설정이 완료되었는지 확인하는 함수
 * @returns {boolean} Firebase 설정 여부
 */
export const isFirebaseConfigured = (): boolean => {
  const { apiKey, authDomain, projectId, appId } = firebaseConfig;
  const isConfigured = Boolean(apiKey && authDomain && projectId && appId);
  console.log('Firebase 설정 완료 여부:', isConfigured);
  return isConfigured;
};

// Firebase 객체 내보내기
export { app, auth, db };
export default { app, auth, db }; 