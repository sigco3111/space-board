import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

/**
 * 애플리케이션의 공통 레이아웃 컴포넌트
 * 헤더, 푸터 및 기본 레이아웃 구조를 제공합니다.
 */
const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAnonymous, logout } = useAuth();
  
  /**
   * 로그아웃 처리
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };
  
  // 현재 경로가 로그인 또는 회원가입 페이지인지 확인
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-background-secondary border-b border-border">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* 로고 */}
          <Link to="/" className="text-2xl font-bold text-text-primary">
            SPACE-BOARD
          </Link>
          
          {/* 네비게이션 */}
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-text-secondary hover:text-text-primary">
                  대시보드
                </Link>
                <div className="relative group">
                  <button className="flex items-center text-text-secondary hover:text-text-primary">
                    <span className="mr-1">
                      {isAnonymous ? (
                        <span className="flex items-center">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 mr-1 text-yellow-500" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                            />
                          </svg>
                          익명 사용자
                        </span>
                      ) : (
                        user?.displayName || '사용자'
                      )}
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 9l-7 7-7-7" 
                      />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-background-secondary border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="py-1">
                      {isAnonymous ? (
                        <>
                          <div className="px-4 py-2 text-xs text-yellow-500 border-b border-border">
                            익명으로 접속 중
                          </div>
                          <Link 
                            to="/login" 
                            className="block px-4 py-2 text-sm text-text-secondary hover:bg-background-tertiary"
                          >
                            로그인
                          </Link>
                          <Link 
                            to="/register" 
                            className="block px-4 py-2 text-sm text-text-secondary hover:bg-background-tertiary"
                          >
                            회원가입
                          </Link>
                        </>
                      ) : (
                        <Link 
                          to="/profile" 
                          className="block px-4 py-2 text-sm text-text-secondary hover:bg-background-tertiary"
                        >
                          프로필
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background-tertiary"
                      >
                        {isAnonymous ? '익명 세션 종료' : '로그아웃'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              !isAuthPage && (
                <>
                  <Link to="/login" className="text-text-secondary hover:text-text-primary">
                    로그인
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 rounded-md bg-accent-primary text-white hover:bg-accent-primary/80"
                  >
                    회원가입
                  </Link>
                </>
              )
            )}
          </nav>
        </div>
      </header>
      
      {/* 익명 사용자 알림 배너 */}
      {isAuthenticated && isAnonymous && !isAuthPage && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 py-2">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center text-sm">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2 text-yellow-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span className="text-text-primary">
                익명으로 접속 중입니다. 일부 기능이 제한될 수 있습니다.
              </span>
            </div>
            <div className="flex space-x-2">
              <Link 
                to="/login" 
                className="text-xs px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-400"
              >
                로그인
              </Link>
              <Link 
                to="/register" 
                className="text-xs px-3 py-1 rounded bg-background-secondary text-text-primary border border-yellow-500/50 hover:border-yellow-500"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* 메인 콘텐츠 */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* 푸터 */}
      <footer className="bg-background-secondary border-t border-border py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-text-secondary text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} SPACE-BOARD. All rights reserved.
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-text-secondary hover:text-text-primary text-sm">
                이용약관
              </a>
              <a href="#" className="text-text-secondary hover:text-text-primary text-sm">
                개인정보 처리방침
              </a>
              <a href="#" className="text-text-secondary hover:text-text-primary text-sm">
                문의하기
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 