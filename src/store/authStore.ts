import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';
import type {
  User,
} from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import type { UserProfile } from '../types/schema';
import { getUserProfile, createOrUpdateUserProfile } from '../services/userService';

/**
 * 인증 스토어 상태 인터페이스
 */
interface AuthState {
  // 상태 (State)
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // 액션 (Actions)
  initialize: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginAnonymously: () => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * 인증 관련 상태를 관리하는 스토어
 */
const useAuthStoreBase = create<AuthState>()(
  immer((set, get) => ({
    // 초기 상태
    user: null,
    userProfile: null,
    isLoading: false,
    error: null,
    isInitialized: false,
    
    // 액션 - 인증 상태 초기화
    initialize: async () => {
      return new Promise<void>((resolve) => {
        // Firebase 인증 상태 변경 감지
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              // 사용자 프로필 정보 조회
              const profile = await getUserProfile(user.uid);
              
              set(state => {
                state.user = user;
                state.userProfile = profile;
                state.isInitialized = true;
                state.isLoading = false;
              });
            } catch (error: any) {
              set(state => {
                state.user = user;
                state.userProfile = null;
                state.error = error.message;
                state.isInitialized = true;
                state.isLoading = false;
              });
            }
          } else {
            set(state => {
              state.user = null;
              state.userProfile = null;
              state.isInitialized = true;
              state.isLoading = false;
            });
          }
          
          resolve();
          unsubscribe(); // 리스너 해제
        });
      });
    },
    
    // 액션 - 이메일/비밀번호로 로그인
    loginWithEmail: async (email, password) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        
        // 사용자 프로필 정보 조회
        const profile = await getUserProfile(user.uid);
        
        // 프로필이 없으면 생성
        if (!profile) {
          await createOrUpdateUserProfile({
            uid: user.uid,
            displayName: user.displayName || email.split('@')[0],
            email: user.email || '',
            photoURL: user.photoURL || '',
            isAnonymous: user.isAnonymous,
          });
        }
        
        set(state => {
          state.user = user;
          state.isLoading = false;
        });
        
        return true;
      } catch (error: any) {
        set(state => {
          state.error = error.message;
          state.isLoading = false;
        });
        
        return false;
      }
    },
    
    // 액션 - Google로 로그인
    loginWithGoogle: async () => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        
        const userCredential = await signInWithPopup(auth, googleProvider);
        const { user } = userCredential;
        
        // 사용자 프로필 정보 업데이트
        await createOrUpdateUserProfile({
          uid: user.uid,
          displayName: user.displayName || 'Google User',
          email: user.email || '',
          photoURL: user.photoURL || '',
          isAnonymous: false,
        });
        
        set(state => {
          state.user = user;
          state.isLoading = false;
        });
        
        return true;
      } catch (error: any) {
        set(state => {
          state.error = error.message;
          state.isLoading = false;
        });
        
        return false;
      }
    },
    
    // 액션 - 익명으로 로그인
    loginAnonymously: async () => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        
        const userCredential = await signInAnonymously(auth);
        const { user } = userCredential;
        
        // 사용자 프로필 정보 생성
        await createOrUpdateUserProfile({
          uid: user.uid,
          displayName: '익명 사용자',
          email: '',
          photoURL: '',
          isAnonymous: true,
        });
        
        set(state => {
          state.user = user;
          state.isLoading = false;
        });
        
        return true;
      } catch (error: any) {
        set(state => {
          state.error = error.message;
          state.isLoading = false;
        });
        
        return false;
      }
    },
    
    // 액션 - 회원가입
    register: async (email, password, displayName) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        
        // 사용자 프로필 정보 생성
        await createOrUpdateUserProfile({
          uid: user.uid,
          displayName,
          email: user.email || '',
          photoURL: '',
          isAnonymous: false,
        });
        
        set(state => {
          state.user = user;
          state.isLoading = false;
        });
        
        return true;
      } catch (error: any) {
        set(state => {
          state.error = error.message;
          state.isLoading = false;
        });
        
        return false;
      }
    },
    
    // 액션 - 로그아웃
    logout: async () => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        
        await signOut(auth);
        
        set(state => {
          state.user = null;
          state.userProfile = null;
          state.isLoading = false;
        });
        
        return true;
      } catch (error: any) {
        set(state => {
          state.error = error.message;
          state.isLoading = false;
        });
        
        return false;
      }
    },
    
    // 액션 - 오류 초기화
    clearError: () => {
      set(state => { state.error = null; });
    },
  }))
);

/**
 * 선택자 함수가 포함된 인증 스토어
 */
const useAuthStore = createSelectorFunctions(useAuthStoreBase);

export { useAuthStore }; 