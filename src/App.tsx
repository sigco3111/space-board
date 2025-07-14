/**
 * 메인 App 컴포넌트
 */
import React, { useEffect, useState } from 'react';
import './App.css';
import { usePostStore, useLayoutStore } from './store';
import VisualizationCanvas from './components/Visualization/VisualizationCanvas';
import Sidebar from './components/common/Sidebar';
import LayoutControls from './components/common/LayoutControls';
import SearchBar from './components/common/SearchBar';

/**
 * App 컴포넌트
 */
const App: React.FC = () => {
  // 스토어에서 필요한 상태 및 액션 가져오기
  const loadPosts = usePostStore.use.loadPosts();
  const calculateNodePositions = useLayoutStore.use.calculateNodePositions();
  const posts = usePostStore.use.posts();
  
  // 사이드바 상태 관리
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 모바일 화면 여부 확인
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // 초기 데이터 로드
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  
  // 게시물 로드 후 노드 위치 계산
  useEffect(() => {
    if (posts.length > 0) {
      calculateNodePositions(posts.map(post => post.id));
    }
  }, [posts, calculateNodePositions]);
  
  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      
      // 데스크톱으로 전환 시 사이드바 자동으로 열기
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      }
    };
    
    // 초기 설정 - 데스크톱에서는 사이드바 기본 열림
    if (window.innerWidth > 768) {
      setIsSidebarOpen(true);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 사이드바 토글 핸들러
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app">
      <VisualizationCanvas />
      <SearchBar />
      <LayoutControls />
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Space Board</h2>
          {isMobile && (
            <button 
              className="sidebar-toggle" 
              onClick={toggleSidebar}
              aria-label="사이드바 닫기"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <Sidebar />
      </div>
      
      {isMobile && (
        <button 
          className="mobile-menu-button"
          onClick={toggleSidebar}
          aria-label="메뉴 열기"
        >
          <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      )}
    </div>
  );
};

export default App; 