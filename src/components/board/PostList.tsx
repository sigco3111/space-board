/**
 * 게시물 목록 컴포넌트
 * 게시물 목록을 조회하여 표시
 */
import React from 'react';
import { Post } from '../../services/postService';

// 게시물 목록 속성 인터페이스 정의
interface PostListProps {
  posts?: Post[];
  category?: string;
  onPostClick?: (post: Post) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * 게시물 목록 컴포넌트
 * @param posts 표시할 게시물 목록 (부모 컴포넌트에서 전달)
 * @param category 조회할 게시물 카테고리 (선택적)
 * @param onPostClick 게시물 클릭 시 호출될 콜백 함수 (선택적)
 * @param isLoading 로딩 상태 (선택적)
 * @param error 에러 메시지 (선택적)
 */
const PostList: React.FC<PostListProps> = ({ 
  posts = [], 
  onPostClick,
  isLoading = false,
  error = null
}) => {
  /**
   * 게시물 클릭 핸들러
   * @param post 클릭된 게시물 정보
   */
  const handlePostClick = (post: Post) => {
    if (onPostClick) {
      onPostClick(post);
    }
  };
  
  /**
   * 날짜를 포맷팅하는 함수
   * @param date 포맷팅할 날짜
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">게시물을 불러오는 중...</p>
      </div>
    );
  }
  
  // 에러 메시지 표시
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
        <p className="font-bold">오류 발생</p>
        <p>{error}</p>
      </div>
    );
  }
  
  // 게시물이 없는 경우 표시
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-500">게시물이 없습니다.</h3>
        <p className="mt-2 text-sm text-gray-400">첫 번째 게시물을 작성해보세요.</p>
      </div>
    );
  }
  
  // 더미 데이터 여부 확인 (ID가 'dummy-'로 시작하는 게시물이 있는지)
  const isDummyData = posts.some(post => post.id.startsWith('dummy-'));
  
  return (
    <div>
      {isDummyData && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">테스트 모드</p>
          <p>Firebase 연결에 문제가 있어 더미 데이터를 표시합니다.</p>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {posts.map((post) => (
            <li key={post.id}>
              <div 
                className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => handlePostClick(post)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-indigo-600 truncate">{post.title}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {post.category}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {post.author.name || '익명'}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      <span>댓글 {post.commentCount}개</span>
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PostList; 