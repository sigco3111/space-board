import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorHooks } from 'auto-zustand-selectors-hook';
import type { User } from '../types';

/**
 * 인증 상태 관리를 위한 스토어 타입 정의
 */
interface AuthState {
  // 상태
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
}

/**
 * 인증 상태 관리를 위한 Zustand 스토어
 * 사용자 정보, 로딩 상태, 에러 상태를 관리합니다.
 */
const useAuthStoreBase = create<AuthState>()(
  immer((set) => ({
    // 초기 상태
    user: null,
    isLoading: false,
    error: null,

    // 액션
    setUser: (user) => set((state) => {
      state.user = user;
    }),
    
    setLoading: (isLoading) => set((state) => {
      state.isLoading = isLoading;
    }),
    
    setError: (error) => set((state) => {
      state.error = error;
    }),
    
    clearError: () => set((state) => {
      state.error = null;
    }),
    
    logout: () => set((state) => {
      state.user = null;
      state.error = null;
    }),
  }))
);

// 자동으로 selector를 생성하여 더 편리하게 상태에 접근할 수 있게 함
const useAuthStore = createSelectorHooks(useAuthStoreBase);

export default useAuthStore; 