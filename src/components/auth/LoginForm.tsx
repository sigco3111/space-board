/**
 * 로그인 양식 컴포넌트
 * 구글 로그인 및 익명 로그인 기능 제공
 */
import React, { useState } from 'react';
import { signInWithGoogle, signInAsAnonymous, UserData } from '../../services/auth';

// 로그인 폼 속성 인터페이스 정의
interface LoginFormProps {
  onLoginSuccess: (user: UserData) => void;
  onLoginError: (error: string) => void;
}

/**
 * 로그인 양식 컴포넌트
 * @param onLoginSuccess 로그인 성공 시 호출될 콜백 함수
 * @param onLoginError 로그인 실패 시 호출될 콜백 함수
 */
const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onLoginError }) => {
  // 로딩 상태 관리
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  /**
   * 구글 로그인 처리 함수
   */
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      const user = await signInWithGoogle();
      onLoginSuccess(user);
    } catch (error) {
      if (error instanceof Error) {
        onLoginError(error.message);
      } else {
        onLoginError('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * 익명 로그인 처리 함수
   */
  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    
    try {
      const user = await signInAsAnonymous();
      onLoginSuccess(user);
    } catch (error) {
      if (error instanceof Error) {
        onLoginError(error.message);
      } else {
        onLoginError('익명 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">로그인</h2>
      
      <div className="space-y-4">
        {/* 구글 로그인 버튼 */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" fill="#4285F4"></path>
            </g>
          </svg>
          {isLoading ? '로그인 중...' : '구글 계정으로 로그인'}
        </button>
        
        {/* 익명 로그인 버튼 */}
        <button
          type="button"
          className="w-full bg-gray-800 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAnonymousLogin}
          disabled={isLoading}
        >
          {isLoading ? '로그인 중...' : '익명으로 로그인'}
        </button>
      </div>
      
      {isLoading && (
        <div className="mt-4 text-center text-sm text-gray-500">
          로그인 처리 중입니다. 잠시만 기다려주세요...
        </div>
      )}
    </div>
  );
};

export default LoginForm; 