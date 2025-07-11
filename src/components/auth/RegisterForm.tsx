import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * 회원가입 폼 컴포넌트
 * 이메일/비밀번호 회원가입과 Google 로그인을 제공합니다.
 */
const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  /**
   * 이메일/비밀번호 회원가입 처리
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    
    // 입력 유효성 검사
    if (!displayName.trim()) {
      setLocalError('이름을 입력해주세요.');
      return;
    }
    
    if (!email.trim()) {
      setLocalError('이메일을 입력해주세요.');
      return;
    }
    
    if (!password) {
      setLocalError('비밀번호를 입력해주세요.');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    
    if (password !== confirmPassword) {
      setLocalError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await register(email, password, displayName);
      navigate('/dashboard');
    } catch (error: any) {
      setLocalError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Google 로그인 처리
   */
  const handleGoogleLogin = async () => {
    clearError();
    setLocalError(null);
    
    try {
      setIsSubmitting(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      setLocalError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center text-text-primary">회원가입</h2>
      
      {/* 에러 메시지 */}
      {(localError || error) && (
        <div className="bg-error/20 border border-error/50 text-text-primary p-3 rounded-lg mb-4">
          {localError || error}
        </div>
      )}
      
      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary mb-1">
            이름
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input w-full"
            placeholder="이름"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
            placeholder="your@email.com"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
            placeholder="비밀번호 (6자 이상)"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">
            비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input w-full"
            placeholder="비밀번호 확인"
            disabled={isSubmitting}
          />
        </div>
        
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? '회원가입 중...' : '회원가입'}
        </button>
      </form>
      
      {/* 구분선 */}
      <div className="flex items-center my-6">
        <div className="flex-grow h-px bg-white/10"></div>
        <span className="px-4 text-sm text-text-secondary">또는</span>
        <div className="flex-grow h-px bg-white/10"></div>
      </div>
      
      {/* Google 로그인 버튼 */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="btn btn-secondary w-full flex items-center justify-center"
        disabled={isSubmitting}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
          />
        </svg>
        Google로 회원가입
      </button>
      
      {/* 로그인 링크 */}
      <div className="mt-6 text-center">
        <span className="text-text-secondary">이미 계정이 있으신가요? </span>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-accent-primary hover:underline"
        >
          로그인
        </button>
      </div>
    </div>
  );
};

export default RegisterForm; 