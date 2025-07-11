import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import useAuth from '../hooks/useAuth';

/**
 * 회원가입 페이지
 * 사용자가 회원가입할 수 있는 페이지입니다.
 */
const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // 이미 로그인한 사용자는 대시보드로 리디렉션
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="card max-w-md w-full">
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register; 