/**
 * 구체 레이아웃 컴포넌트
 * 게시물 노드를 3D 구체 형태로 배치하는 레이아웃
 */
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Post } from '../../../services/postService';
import { useLayoutStore } from '../../../store';
import { calculateSphereLayout } from '../../../utils/layoutUtils';
import PostNode from '../PostNode';
import * as THREE from 'three';

/**
 * 구체 레이아웃 속성 인터페이스
 */
interface SphereLayoutProps {
  posts: Post[];
  selectedPostId: string | null;
  highlightPostIds: string[];
  xRayMode: boolean;
}

/**
 * 구체 레이아웃 컴포넌트
 * 게시물을 3D 구체 형태로 배치
 */
const SphereLayout: React.FC<SphereLayoutProps> = ({
  posts,
  selectedPostId,
  highlightPostIds,
  xRayMode,
}) => {
  // 레이아웃 스토어에서 상태 및 액션 가져오기
  const setSphereLayout = useLayoutStore.use.setSphereLayout();
  const nodePositions = useLayoutStore.use.nodePositions();
  
  // 애니메이션 참조
  const groupRef = useRef<THREE.Group>(null);
  const animationProgress = useRef(0);
  const isAnimating = useRef(false);
  const autoRotate = useRef(true);
  const rotationSpeed = useRef(0.001);
  
  // 게시물 목록이 변경되면 구체 레이아웃 계산
  useEffect(() => {
    if (posts.length > 0) {
      const positions = calculateSphereLayout(posts);
      setSphereLayout(positions);
      
      // 레이아웃이 변경되면 애니메이션 시작
      animationProgress.current = 0;
      isAnimating.current = true;
    }
  }, [posts, setSphereLayout]);

  // 애니메이션 효과를 위한 프레임 업데이트 및 회전
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // 레이아웃 전환 애니메이션
      if (isAnimating.current) {
        // 애니메이션 진행
        animationProgress.current += 0.015;
        
        if (animationProgress.current >= 1) {
          animationProgress.current = 1;
          isAnimating.current = false;
        }
        
        // 구체 레이아웃 애니메이션 효과
        const progress = easeOutElastic(animationProgress.current);
        
        // 구체 확장 애니메이션
        const scale = 0.5 + progress * 0.5;
        groupRef.current.scale.set(scale, scale, scale);
        
        // 회전 속도 조정
        rotationSpeed.current = 0.001 * (1 - progress) + 0.0002 * progress;
      }
      
      // 자동 회전 (선택된 게시물이 없을 때)
      if (autoRotate.current && selectedPostId === null) {
        groupRef.current.rotation.y += rotationSpeed.current * clock.getDelta() * 60;
        
        // 약간의 상하 움직임 추가
        const time = clock.getElapsedTime();
        groupRef.current.position.y = Math.sin(time * 0.2) * 5;
      } else if (selectedPostId !== null) {
        // 선택된 게시물이 있으면 회전 천천히 멈춤
        rotationSpeed.current *= 0.95;
        if (rotationSpeed.current < 0.00001) rotationSpeed.current = 0;
      }
    }
  });
  
  /**
   * Elastic ease-out 함수
   * @param x 진행도 (0-1)
   * @returns 완화된 진행도 값
   */
  const easeOutElastic = (x: number): number => {
    const c4 = (2 * Math.PI) / 3;
    
    return x === 0
      ? 0
      : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
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

export default SphereLayout; 