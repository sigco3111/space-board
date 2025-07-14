/**
 * 게시물 노드 컴포넌트
 * Three.js를 사용한 게시물 시각화 노드
 */
import React, { useMemo, useState, useCallback } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { Post } from '../../services/postService';
import { usePostStore } from '../../store';
import { colorUtils } from '../../utils/colorUtils';
import * as THREE from 'three';
import NodePreview from './NodePreview';

// 노드 크기 상수
const ASPECT_RATIO = 16 / 9;
const THUMB_HEIGHT = 16;
const THUMB_WIDTH = THUMB_HEIGHT * ASPECT_RATIO;

/**
 * 게시물 노드 속성 인터페이스
 */
interface PostNodeProps {
  post: Post;
  x?: number;
  y?: number;
  z?: number;
  highlight?: boolean;
  dim?: boolean;
  xRayMode?: boolean;
}

/**
 * HTML 태그 제거 함수
 */
const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * 게시물 노드 컴포넌트
 * 3D 공간에 게시물을 표현하는 노드
 */
const PostNode: React.FC<PostNodeProps> = React.memo(({
  post,
  x = 0,
  y = 0,
  z = 0,
  highlight = false,
  dim = false,
  xRayMode = false,
}) => {
  // 게시물 선택 액션
  const selectPost = usePostStore.use.selectPost();
  
  // 로컬 상태
  const [hovered, setHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // 투명도 계산
  const opacity = highlight || hovered ? 1 : dim ? 0.3 : 1;
  
  // 게시물 카테고리에 따른 색상 결정
  const color = useMemo(() => colorUtils.getCategoryColor(post.category), [post.category]);
  
  // 게시물 설명 텍스트 생성 (제목 + 내용 일부)
  const shortContent = useMemo(() => {
    const plainText = stripHtmlTags(post.content);
    return plainText.slice(0, 50) + (plainText.length > 50 ? '...' : '');
  }, [post.content]);
  
  // 노드 스케일 계산 (호버 시 약간 확대)
  const scale = useMemo(() => {
    const baseScale: [number, number, number] = [THUMB_WIDTH, THUMB_HEIGHT, 1];
    return hovered ? baseScale.map(s => s * 1.05) as [number, number, number] : baseScale;
  }, [hovered]);
  
  // 호버 이벤트 핸들러
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);
  
  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);
  
  // 클릭 핸들러
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectPost(post.id);
    setShowPreview(true);
  }, [post.id, selectPost]);
  
  // 미리보기 닫기 핸들러
  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  // 노드 위치 계산 (메모이제이션)
  const position = useMemo(() => 
    [x * 500, y * 500, z * 500] as [number, number, number], 
    [x, y, z]
  );

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <group>
        {/* 게시물 카드 */}
        <Billboard>
          <mesh scale={scale}>
            <planeGeometry />
            <meshStandardMaterial
              color={xRayMode ? "#999" : color}
              opacity={opacity}
              transparent={opacity < 1}
              emissive={hovered ? color : "#000000"}
              emissiveIntensity={hovered ? 0.3 : 0}
            />
          </mesh>
        </Billboard>

        {/* 게시물 제목 */}
        <Billboard>
          <Text
            font="/fonts/NotoSansKR-Regular.ttf"
            fontSize={1.2}
            color="white"
            anchorX="center"
            anchorY="top"
            position={[0, -(THUMB_HEIGHT / 2) - 1, 0]}
            maxWidth={THUMB_WIDTH}
            fillOpacity={opacity}
          >
            {post.title}
          </Text>
        </Billboard>

        {/* X-Ray 모드 시 내용 표시 */}
        {xRayMode && (
          <Billboard>
            <Text
              font="/fonts/NotoSansKR-Regular.ttf"
              fontSize={0.8}
              color="white"
              anchorX="left"
              anchorY="middle"
              position={[-(THUMB_WIDTH / 2) + 1, 0, 1]}
              maxWidth={THUMB_WIDTH - 2}
              fillOpacity={opacity}
            >
              {shortContent}
            </Text>
          </Billboard>
        )}
      </group>
      
      {/* 게시물 미리보기 */}
      {showPreview && (
        <NodePreview
          post={post}
          position={[0, 0, 10] as [number, number, number]}
          visible={showPreview}
          onClose={handleClosePreview}
        />
      )}
    </group>
  );
}, (prevProps, nextProps) => {
  // 최적화를 위한 비교 함수
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.z === nextProps.z &&
    prevProps.highlight === nextProps.highlight &&
    prevProps.dim === nextProps.dim &&
    prevProps.xRayMode === nextProps.xRayMode
  );
});

// 디버깅을 위한 컴포넌트 이름 설정
PostNode.displayName = 'PostNode';

export default PostNode; 