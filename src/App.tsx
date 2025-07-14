/**
 * App 컴포넌트
 * 애플리케이션의 메인 컴포넌트로, 로그인 및 게시물 목록 표시 기능 제공
 */
import React, { useEffect, useState } from 'react';
import './App.css';
import { auth } from './services/firebase';
import { getAllPosts } from './services/postService';
import { Post } from './services/postService';
import LoginForm from './components/auth/LoginForm';
import PostList from './components/board/PostList';
import initFirestore from './services/initDb';
import { UserData, signInWithGoogle, signInAsAnonymous } from './services/auth';

function App() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Firebase 인증 상태 변화 감지
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const userData: UserData = {
          uid: user.uid,
          displayName: user.displayName || '사용자',
          email: user.email,
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous || false
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      console.log('인증 상태 변경:', user ? '로그인됨' : '로그인되지 않음');
    });
    
    return () => unsubscribe();
  }, []);
  
  // 게시물 데이터 로드
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Firestore 초기화 (샘플 데이터 추가)
        try {
          await initFirestore();
          console.log('Firestore 초기화 완료');
        } catch (initError) {
          console.warn('Firestore 초기화 중 오류 발생 (무시하고 계속 진행):', initError);
        }
        
        // 게시물 불러오기
        console.time('게시물 로딩');
        const postsData = await getAllPosts();
        console.timeEnd('게시물 로딩');
        console.log(`게시물 ${postsData.length}개 로드 완료`);
        setPosts(postsData);
      } catch (error) {
        console.error('게시물 로드 중 오류 발생:', error);
        setError('게시물을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPosts();
  }, []);
  
  // 게시물 클릭 핸들러
  const handlePostClick = (post: Post) => {
    console.log('게시물 클릭:', post.id, post.title);
    // 여기에 게시물 클릭 시 동작 구현
  };
  
  // 로그인 성공 핸들러
  const handleLoginSuccess = (userData: UserData) => {
    console.log('로그인 성공:', userData);
    setUser(userData);
    setError(null);
  };
  
  // 로그인 실패 핸들러
  const handleLoginError = (errorMessage: string) => {
    console.error('로그인 실패:', errorMessage);
    setError(errorMessage);
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>SPACE-BOARD</h1>
        {user ? (
          <div className="user-info">
            <p>안녕하세요, {user.displayName}님!</p>
          </div>
        ) : (
          <LoginForm 
            onLoginSuccess={handleLoginSuccess}
            onLoginError={handleLoginError}
          />
        )}
      </header>
      
      <main className="App-main">
        <h2>게시물 목록</h2>
        <PostList 
          posts={posts}
          onPostClick={handlePostClick}
          isLoading={loading}
          error={error}
        />
      </main>
    </div>
  );
}

export default App; 