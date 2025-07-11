import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import useAuth from './hooks/useAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// 페이지 컴포넌트 (일부는 아직 구현되지 않음)
const Board = () => <div className="p-4">보드 페이지</div>;

/**
 * 인증이 필요한 라우트를 위한 컴포넌트
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

/**
 * 애플리케이션의 메인 컴포넌트
 * 라우팅 및 전체 레이아웃을 관리합니다.
 */
function App() {
  const { isLoading } = useAuth();
  const [isAppReady, setIsAppReady] = useState(false);
  
  // 앱 초기화 및 인증 상태 확인
  useEffect(() => {
    if (!isLoading) {
      setIsAppReady(true);
    }
  }, [isLoading]);
  
  // 앱이 준비되지 않은 경우 로딩 화면 표시
  if (!isAppReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="w-16 h-16 border-t-4 border-accent-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-text-primary">SPACE-BOARD 로딩 중...</p>
      </div>
    );
  }
  
  return (
    <Router>
      <Layout>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 보호된 라우트 */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/board/:boardId" 
            element={
              <ProtectedRoute>
                <Board />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 페이지 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
