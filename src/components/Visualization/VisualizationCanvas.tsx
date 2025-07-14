/**
 * 시각화 캔버스 컴포넌트
 * Three.js를 사용한 3D 시각화 렌더링을 담당
 */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { usePostStore, useLayoutStore, useUIStore } from '../../store';

// 동적으로 로드할 컴포넌트들
const PostNode = lazy(() => import('./PostNode'));
const GridLayout = lazy(() => import('./layouts/GridLayout'));
const SphereLayout = lazy(() => import('./layouts/SphereLayout'));

// 로딩 컴포넌트
const LoadingFallback = () => (
  <mesh>
    <sphereGeometry args={[0.5, 16, 16]} />
    <meshStandardMaterial color="gray" wireframe />
  </mesh>
);

/**
 * 시각화 캔버스 컴포넌트
 */
const VisualizationCanvas: React.FC = () => {
  // 스토어에서 필요한 상태 가져오기
  const posts = usePostStore.use.posts();
  const selectedPostId = usePostStore.use.selectedPostId();
  const highlightPostIds = usePostStore.use.highlightPostIds();
  const nodePositions = useLayoutStore.use.nodePositions();
  const currentLayout = useLayoutStore.use.currentLayout();
  const selectPost = usePostStore.use.selectPost();
  const setHoveredPostId = useUIStore.use.setHoveredPostId();
  
  // 노드 위치 상태 관리
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>({});
  
  // 노드 위치 업데이트
  useEffect(() => {
    setPositions(nodePositions);
  }, [nodePositions]);
  
  // 마우스 이벤트 핸들러
  const handleNodeClick = (postId: string) => {
    selectPost(postId);
  };
  
  const handleNodeHover = (postId: string | null) => {
    setHoveredPostId(postId);
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 50 }}
        style={{ background: '#111' }}
      >
        {/* 조명 설정 */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* 카메라 컨트롤 */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
        
        {/* 노드 렌더링 */}
        <Suspense fallback={<LoadingFallback />}>
          {posts.map((post) => (
            positions[post.id] && (
              <PostNode
                key={post.id}
                post={post}
                position={positions[post.id]}
                isSelected={post.id === selectedPostId}
                isHighlighted={highlightPostIds.includes(post.id)}
                onClick={() => handleNodeClick(post.id)}
                onHover={(hover) => handleNodeHover(hover ? post.id : null)}
              />
            )
          ))}
          
          {/* 레이아웃 컴포넌트 */}
          {currentLayout === 'grid' && <GridLayout />}
          {currentLayout === 'sphere' && <SphereLayout />}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default VisualizationCanvas; 