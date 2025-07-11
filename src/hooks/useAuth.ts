import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  loginAnonymously,
  logout,
  resetPassword,
  getCurrentUser,
} from '../services/auth';
import useAuthStore from '../store/useAuthStore';
import type { User } from '../types';

/**
 * 인증 관련 기능을 제공하는 커스텀 훅
 * 로그인, 회원가입, 로그아웃 등의 기능을 제공합니다.
 */
const useAuth = () => {
  // 상태 관리 스토어에서 필요한 값과 액션 가져오기
  const { user, isLoading, error } = useAuthStore();
  const { setUser, setLoading, setError, clearError } = useAuthStore();
  
  // 컴포넌트 마운트 시 현재 로그인 상태 확인
  useEffect(() => {
    setLoading(true);
    
    // Firebase 인증 상태 변경 감지
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 로그인된 상태
          const appUser = await getCurrentUser();
          setUser(appUser);
        } else {
          // 로그아웃된 상태
          setUser(null);
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });
    
    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, [setUser, setLoading, setError]);
  
  /**
   * 이메일/비밀번호로 회원가입
   */
  const register = useCallback(
    async (email: string, password: string, displayName: string): Promise<User> => {
      clearError();
      setLoading(true);
      
      try {
        const user = await registerWithEmail(email, password, displayName);
        setUser(user);
        return user;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setUser, setError]
  );
  
  /**
   * 이메일/비밀번호로 로그인
   */
  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      clearError();
      setLoading(true);
      
      try {
        const user = await loginWithEmail(email, password);
        setUser(user);
        return user;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setUser, setError]
  );
  
  /**
   * Google로 로그인
   */
  const loginWithGoogleProvider = useCallback(
    async (): Promise<User> => {
      clearError();
      setLoading(true);
      
      try {
        const user = await loginWithGoogle();
        setUser(user);
        return user;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setUser, setError]
  );
  
  /**
   * 익명으로 로그인
   */
  const loginAsAnonymous = useCallback(
    async (): Promise<User> => {
      clearError();
      setLoading(true);
      
      try {
        const user = await loginAnonymously();
        setUser(user);
        return user;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setUser, setError]
  );
  
  /**
   * 로그아웃
   */
  const logoutUser = useCallback(
    async (): Promise<void> => {
      clearError();
      setLoading(true);
      
      try {
        await logout();
        setUser(null);
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setUser, setError]
  );
  
  /**
   * 비밀번호 재설정 이메일 발송
   */
  const sendPasswordReset = useCallback(
    async (email: string): Promise<void> => {
      clearError();
      setLoading(true);
      
      try {
        await resetPassword(email);
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setError]
  );
  
  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous || false,
    register,
    login,
    loginWithGoogle: loginWithGoogleProvider,
    loginAnonymously: loginAsAnonymous,
    logout: logoutUser,
    sendPasswordReset,
    clearError,
  };
};

export default useAuth; 