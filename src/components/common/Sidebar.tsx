/**
 * 사이드바 컴포넌트
 * 게시물 목록 및 필터링 기능 제공
 */
import React from 'react';
import { usePostStore } from '../../store';
import { Post } from '../../services/postService';
import { colorUtils } from '../../utils/colorUtils';

/**
 * 사이드바 속성 인터페이스
 */
interface SidebarProps {
  className?: string;
}

/**
 * 사이드바 컴포넌트
 */
const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  // 스토어에서 필요한 상태 및 액션 가져오기
  const posts = usePostStore.use.filteredPosts();
  const selectedPostId = usePostStore.use.selectedPostId();
  const selectPost = usePostStore.use.selectPost();
  const searchQuery = usePostStore.use.searchQuery();
  const categoryFilter = usePostStore.use.categoryFilter();
  
  // 게시물 정렬 (최신순)
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return dateB - dateA;
  });
  
  // 게시물 선택 핸들러
  const handlePostSelect = (post: Post) => {
    selectPost(post.id);
  };
  
  // 게시물 날짜 포맷팅
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    
    return date instanceof Date 
      ? date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : '';
  };
  
  // 게시물 내용 요약
  const summarizeContent = (content: string, maxLength: number = 50) => {
    // HTML 태그 제거
    const plainText = content.replace(/<[^>]*>/g, '');
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <div className={`sidebar-content ${className}`}>
      {/* 필터링 정보 표시 */}
      {(searchQuery || categoryFilter) && (
        <div className="filter-info">
          {searchQuery && <span className="search-tag">검색: {searchQuery}</span>}
          {categoryFilter && <span className="category-tag">카테고리: {categoryFilter}</span>}
          <span className="result-count">{posts.length}개 결과</span>
        </div>
      )}
      
      {/* 게시물 목록 */}
      {sortedPosts.length > 0 ? (
        <ul className="post-list">
          {sortedPosts.map((post) => (
            <li
              key={post.id}
              className={`post-item ${selectedPostId === post.id ? 'selected' : ''}`}
              onClick={() => handlePostSelect(post)}
            >
              <div className="post-header">
                <span
                  className="post-category"
                  style={{ backgroundColor: colorUtils.getCategoryColor(post.category) }}
                >
                  {post.category || '일반'}
                </span>
                <span className="post-date">{formatDate(post.createdAt)}</span>
              </div>
              
              <h3 className="post-title">{post.title}</h3>
              
              <p className="post-summary">{summarizeContent(post.content)}</p>
              
              <div className="post-meta">
                <span className="post-author">
                  {post.author?.name || '익명'}
                </span>
                <div className="post-stats">
                  <span className="post-views">
                    <i className="fas fa-eye"></i> {post.viewCount || 0}
                  </span>
                  <span className="post-comments">
                    <i className="fas fa-comment"></i> {post.commentCount || 0}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <p>게시물이 없습니다.</p>
          {(searchQuery || categoryFilter) && (
            <p className="empty-hint">검색어나 필터를 변경해보세요.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar; 