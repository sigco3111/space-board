import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * 홈 페이지
 * 애플리케이션의 랜딩 페이지입니다.
 */
const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* 히어로 섹션 */}
      <section className="flex-grow flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6">
          SPACE-BOARD
        </h1>
        <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mb-10">
          아이디어를 3D 공간에 시각화하고 공유하는 새로운 방법
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary btn-lg"
            >
              대시보드로 이동
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary btn-lg"
              >
                무료로 시작하기
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary btn-lg"
              >
                로그인
              </button>
            </>
          )}
        </div>
      </section>
      
      {/* 기능 소개 섹션 */}
      <section className="bg-background-secondary py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            주요 기능
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-accent-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-accent-primary" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" 
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">3D 시각화</h3>
              <p className="text-text-secondary">
                텍스트, 이미지, 링크를 3D 공간에 자유롭게 배치하고 시각화할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-accent-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-accent-primary" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">협업 기능</h3>
              <p className="text-text-secondary">
                팀원들과 실시간으로 아이디어를 공유하고 협업할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-accent-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-accent-primary" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">필터링 및 검색</h3>
              <p className="text-text-secondary">
                태그와 키워드를 기반으로 콘텐츠를 필터링하고 검색할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA 섹션 */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-6">
          지금 바로 시작하세요
        </h2>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
          SPACE-BOARD와 함께 아이디어를 새로운 차원으로 확장하세요.
        </p>
        <button
          onClick={() => isAuthenticated ? navigate('/dashboard') : navigate('/register')}
          className="btn btn-primary btn-lg"
        >
          {isAuthenticated ? '대시보드로 이동' : '무료로 시작하기'}
        </button>
      </section>
    </div>
  );
};

export default Home; 