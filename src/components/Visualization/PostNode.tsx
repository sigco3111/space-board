import { useState, useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { Billboard, useTexture } from '@react-three/drei';
import { TextureLoader, Mesh, MeshStandardMaterial } from 'three';
import type { Post } from '../../types/schema';
import { ThreeEvent } from '@react-three/fiber';
import { getCategoryColor } from '../../utils/colorUtils';
import NodeLabel from './NodeLabel';
import NodePreview from './NodePreview';

/**
 * 게시물 노드 컴포넌트 속성
 */
interface PostNodeProps {
  /**
   * 게시물 데이터
   */
  post: Post;
  
  /**
   * 하이라이트 여부
   */
  highlight?: boolean;
  
  /**
   * 흐림 처리 여부
   */
  dim?: boolean;
  
  /**
   * X-Ray 모드 여부
   */
  xRayMode?: boolean;
  
  /**
   * 클릭 이벤트 핸들러
   */
  onClick?: () => void;
}

/**
 * 게시물 노드 컴포넌트
 * 3D 공간에서 게시물을 표현하는 노드입니다.
 */
const PostNode = ({
  post,
  highlight = false,
  dim = false,
  xRayMode = false,
  onClick
}: PostNodeProps) => {
  // 상태
  const [hovered, setHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  
  // 참조
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  
  // 게시물 이미지 로드 (있는 경우)
  let texture;
  try {
    if (post.imageUrl) {
      texture = useLoader(TextureLoader, post.imageUrl);
    }
  } catch (error) {
    console.warn(`이미지 로드 실패: ${post.imageUrl}`, error);
  }
  
  // 카테고리 색상 계산
  const categoryColor = useMemo(() => getCategoryColor(post.category), [post.category]);
  
  // 노드 크기 설정
  const aspectRatio = 1; // 정사각형 기본값
  const nodeHeight = 3;
  const nodeWidth = nodeHeight * aspectRatio;
  const nodeSize = { width: nodeWidth, height: nodeHeight };
  
  // 투명도 계산
  const opacity = highlight ? 1 : dim ? 0.3 : 1;
  
  // 호버 이벤트 핸들러
  const handlePointerOver = () => {
    setHovered(true);
    // 0.5초 후에 미리보기 표시
    setTimeout(() => {
      if (hovered) {
        setShowPreview(true);
      }
    }, 500);
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    setShowPreview(false);
  };
  
  // 클릭 이벤트 핸들러
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onClick) onClick();
  };
  
  // 애니메이션 효과
  useFrame((_, delta) => {
    // 호버 시 펄스 애니메이션
    if (hovered) {
      setPulseIntensity((prev) => {
        const newValue = prev + delta * 2;
        return newValue > 1 ? 0 : newValue;
      });
      
      if (materialRef.current) {
        const pulseValue = Math.sin(pulseIntensity * Math.PI) * 0.2 + 0.8;
        materialRef.current.emissiveIntensity = pulseValue;
      }
    } else if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0;
    }
    
    // 하이라이트 효과
    if (highlight && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  
  return (
    <group
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <Billboard>
        {/* 게시물 배경 */}
        <mesh
          ref={meshRef}
          scale={[nodeWidth, nodeHeight, 0.1]}
          position={[0, 0, 0]}
        >
          <boxGeometry />
          <meshStandardMaterial
            ref={materialRef}
            color={highlight ? '#4285F4' : hovered ? categoryColor : categoryColor}
            transparent
            opacity={opacity}
            metalness={0.5}
            roughness={0.5}
            emissive={categoryColor}
            emissiveIntensity={0}
          />
        </mesh>
        
        {/* 게시물 이미지 (있는 경우) */}
        {texture && (
          <mesh
            scale={[nodeWidth * 0.9, nodeHeight * 0.6, 0.05]}
            position={[0, nodeHeight * 0.1, 0.06]}
          >
            <planeGeometry />
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={opacity}
            />
          </mesh>
        )}
        
        {/* 게시물 라벨 */}
        <NodeLabel
          post={post}
          nodeSize={nodeSize}
          highlight={highlight}
          dim={dim}
          hovered={hovered}
          xRayMode={xRayMode}
        />
      </Billboard>
      
      {/* 게시물 미리보기 (호버 시) */}
      <NodePreview
        post={post}
        visible={showPreview}
        position={[0, nodeHeight * 0.8, 0]}
        onClick={onClick}
      />
    </group>
  );
};

export default PostNode; 