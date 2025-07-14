/**
 * 노드 미리보기 컴포넌트
 * 게시물 노드를 클릭하거나 호버했을 때 표시되는 상세 미리보기
 */
import React from 'react';
import { Html } from '@react-three/drei';
import { Post } from '../../services/postService';
import { colorUtils } from '../../utils/colorUtils';

/**
 * 노드 미리보기 속성 인터페이스
 */
interface NodePreviewProps {
  post: Post;
  position: [number, number, number];
  visible: boolean;
  onClose?: () => void;
}

/**
 * 노드 미리보기 컴포넌트
 * 게시물 상세 내용을 HTML 오버레이로 표시
 */
const NodePreview: React.FC<NodePreviewProps> = ({
  post,
  position,
  visible,
  onClose,
}) => {
  // 보이지 않는 상태면 렌더링하지 않음
  if (!visible) {
    return null;
  }

  // 게시물 카테고리에 따른 색상 결정
  const categoryColor = colorUtils.getCategoryColor(post.category);
  
  // 게시물 내용에서 HTML 태그 제거
  const contentText = post.content
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .trim();
  
  // 내용이 너무 길면 잘라내기 (최대 200자)
  const truncatedContent = contentText.length > 200
    ? contentText.substring(0, 200) + '...'
    : contentText;
  
  // 날짜 포맷팅
  const formattedDate = post.createdAt 
    ? new Date(post.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // 작성자 이름 표시
  const authorName = post.author?.name || '익명';

  return (
    <Html
      position={position}
      distanceFactor={15}
      zIndexRange={[100, 0]}
      center
      style={{
        pointerEvents: 'auto',
      }}
    >
      <div
        className="node-preview"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: '#fff',
          padding: '1rem',
          borderRadius: '0.5rem',
          width: '300px',
          maxHeight: '400px',
          overflowY: 'auto',
          boxShadow: `0 0 10px ${categoryColor}`,
          border: `1px solid ${categoryColor}`,
        }}
      >
        <div
          className="preview-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <span
            className="category-badge"
            style={{
              backgroundColor: categoryColor,
              padding: '0.2rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.8rem',
            }}
          >
            {post.category || '일반'}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            ×
          </button>
        </div>

        <h3
          style={{
            margin: '0.5rem 0',
            fontSize: '1.2rem',
          }}
        >
          {post.title}
        </h3>

        <div
          className="preview-meta"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#aaa',
            marginBottom: '0.5rem',
          }}
        >
          <span>{authorName}</span>
          <span>{formattedDate}</span>
        </div>

        <p
          style={{
            margin: '0.5rem 0',
            fontSize: '0.9rem',
            lineHeight: '1.4',
          }}
        >
          {truncatedContent}
        </p>

        <div
          className="preview-footer"
          style={{
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#aaa',
          }}
        >
          <span>조회 {post.viewCount || 0}</span>
          <span>댓글 {post.commentCount || 0}</span>
        </div>
      </div>
    </Html>
  );
};

export default NodePreview; 