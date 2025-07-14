/**
 * 노드 레이블 컴포넌트
 * 3D 공간에서 게시물 노드 위에 표시되는 텍스트 레이블
 */
import React from 'react';
import { Billboard, Text } from '@react-three/drei';
import { Post } from '../../services/postService';

/**
 * 노드 레이블 속성 인터페이스
 */
interface NodeLabelProps {
  post: Post;
  position: [number, number, number];
  opacity?: number;
  fontSize?: number;
  color?: string;
  visible?: boolean;
}

/**
 * 노드 레이블 컴포넌트
 * 게시물 제목과 간단한 정보를 3D 공간에 표시
 */
const NodeLabel: React.FC<NodeLabelProps> = ({
  post,
  position,
  opacity = 1,
  fontSize = 1.2,
  color = 'white',
  visible = true,
}) => {
  // 표시할 내용이 없거나 보이지 않는 상태면 렌더링하지 않음
  if (!visible || !post.title) {
    return null;
  }

  // 게시물 정보 가공
  const title = post.title;
  const authorInfo = post.author ? `by ${post.author}` : '';
  const dateInfo = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '';
  
  // 레이블 텍스트 조합
  const labelText = [title, authorInfo, dateInfo].filter(Boolean).join('\n');

  return (
    <Billboard
      position={position}
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <Text
        font="/fonts/NotoSansKR-Regular.ttf"
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={20}
        fillOpacity={opacity}
        outlineWidth={0.05}
        outlineColor="#000000"
        outlineOpacity={0.5}
      >
        {labelText}
      </Text>
    </Billboard>
  );
};

export default NodeLabel; 