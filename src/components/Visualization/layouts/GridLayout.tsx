/**
 * 그리드 레이아웃 컴포넌트
 * 게시물 노드를 2D 그리드 형태로 배치하는 레이아웃
 */
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Post } from '../../../services/postService';
import { useLayoutStore } from '../../../store';
import { calculateGridLayout } from '../../../utils/layoutUtils';
import PostNode from '../PostNode';
import * as THREE from 'three';

/**
 * 그리드 레이아웃 속성 인터페이스
 */
interface GridLayoutProps {
  posts: Post[];
  selectedPostId: string | null;
  highlightPostIds: string[];
  xRayMode: boolean;
}

/**
 * 그리드 레이아웃 컴포넌트
 * 게시물을 균등한 그리드 형태로 배치
 */
const GridLayout: React.FC<GridLayoutProps> = ({
  posts,
  selectedPostId,
  highlightPostIds,
  xRayMode,
}) => {
  // 레이아웃 스토어에서 상태 및 액션 가져오기
  const setGridLayout = useLayoutStore.use.setGridLayout();
  const nodePositions = useLayoutStore.use.nodePositions();
  
  // 애니메이션 참조
  const groupRef = useRef<THREE.Group>(null);
  const animationProgress = useRef(0);
  const isAnimating = useRef(false);
  
  // 게시물 목록이 변경되면 그리드 레이아웃 계산
  useEffect(() => {
    if (posts.length > 0) {
      const positions = calculateGridLayout(posts);
      setGridLayout(positions);
      
      // 레이아웃이 변경되면 애니메이션 시작
      animationProgress.current = 0;
      isAnimating.current = true;
    }
  }, [posts, setGridLayout]);

  // 애니메이션 효과를 위한 프레임 업데이트
  useFrame(() => {
    if (isAnimating.current && groupRef.current) {
      // 애니메이션 진행
      animationProgress.current += 0.02;
      
      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }
      
      // 그리드 레이아웃 애니메이션 효과
      const progress = easeOutCubic(animationProgress.current);
      
      // 그리드 레이아웃에서는 Z축을 0으로 평평하게 만드는 애니메이션
      groupRef.current.position.z = (1 - progress) * 200;
      groupRef.current.rotation.x = (1 - progress) * Math.PI * 0.1;
      
      // 그룹 스케일 애니메이션
      const scale = 0.8 + progress * 0.2;
      groupRef.current.scale.set(scale, scale, scale);
    }
  });
  
  /**
   * Cubic ease-out 함수
   * @param x 진행도 (0-1)
   * @returns 완화된 진행도 값
   */
  const easeOutCubic = (x: number): number => {
    return 1 - Math.pow(1 - x, 3);
  };

  return (
    <group ref={groupRef}>
      {posts.map((post) => {
        // 노드 위치 계산
        const position = nodePositions[post.id] || [0.5, 0.5, 0.5];
        const [x, y, z] = position;
        
        // 하이라이트 및 선택 상태 계산
        const isHighlighted = highlightPostIds.includes(post.id);
        const isSelected = selectedPostId === post.id;
        const isDimmed = (highlightPostIds.length > 0 && !isHighlighted) || 
                        (selectedPostId !== null && selectedPostId !== post.id);
        
        return (
          <PostNode
            key={post.id}
            post={post}
            x={x - 0.5}
            y={y - 0.5}
            z={z - 0.5}
            highlight={isHighlighted || isSelected}
            dim={isDimmed}
            xRayMode={xRayMode}
          />
        );
      })}
    </group>
  );
};

export default GridLayout; 