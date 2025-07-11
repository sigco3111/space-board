import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';
import type { Post } from '../types/schema';

/**
 * 레이아웃 타입 정의
 */
type LayoutType = 'sphere' | 'grid';

/**
 * 노드 위치 타입 정의
 */
interface NodePosition {
  id: string;
  position: [number, number, number];
  visible: boolean;
}

/**
 * 레이아웃 스토어 상태 인터페이스
 */
interface LayoutState {
  // 상태 (State)
  layoutType: LayoutType;
  nodePositions: NodePosition[] | null;
  highlightedNodeIds: string[] | null;
  resetCamera: boolean;
  xRayMode: boolean;
  targetNodeId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // 액션 (Actions)
  setLayoutType: (type: LayoutType) => void;
  calculateNodePositions: (posts: Post[]) => void;
  highlightNodes: (nodeIds: string[] | null) => void;
  setTargetNode: (nodeId: string | null) => void;
  resetCameraPosition: () => void;
  toggleXRayMode: () => void;
  clearError: () => void;
}

/**
 * 구체형 레이아웃에서 노드 위치 계산
 * @param posts 게시물 목록
 * @returns 노드 위치 배열
 */
const calculateSphereLayout = (posts: Post[]): NodePosition[] => {
  // 피보나치 구체 알고리즘 사용
  const positions: NodePosition[] = [];
  const total = posts.length;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const angleIncrement = Math.PI * 2 * goldenRatio;
  
  for (let i = 0; i < total; i++) {
    const t = i / total;
    const inclination = Math.acos(1 - 2 * t);
    const azimuth = angleIncrement * i;
    
    // 구체 좌표 계산 (반지름 5)
    const radius = 5;
    const x = radius * Math.sin(inclination) * Math.cos(azimuth);
    const y = radius * Math.sin(inclination) * Math.sin(azimuth);
    const z = radius * Math.cos(inclination);
    
    positions.push({
      id: posts[i].id,
      position: [x, y, z],
      visible: true
    });
  }
  
  return positions;
};

/**
 * 그리드형 레이아웃에서 노드 위치 계산
 * @param posts 게시물 목록
 * @returns 노드 위치 배열
 */
const calculateGridLayout = (posts: Post[]): NodePosition[] => {
  const positions: NodePosition[] = [];
  const total = posts.length;
  
  // 그리드 크기 계산
  const gridSize = Math.ceil(Math.sqrt(total));
  const spacing = 1.5; // 노드 간 간격
  
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    
    // 중앙 정렬을 위한 오프셋 계산
    const offsetX = (gridSize - 1) * spacing / 2;
    const offsetZ = (gridSize - 1) * spacing / 2;
    
    const x = (col * spacing) - offsetX;
    const y = 0; // 모든 노드가 같은 높이에 위치
    const z = (row * spacing) - offsetZ;
    
    positions.push({
      id: posts[i].id,
      position: [x, y, z],
      visible: true
    });
  }
  
  return positions;
};

/**
 * 레이아웃 관련 상태를 관리하는 스토어
 */
const useLayoutStoreBase = create<LayoutState>()(
  immer((set, get) => ({
    // 초기 상태
    layoutType: 'sphere',
    nodePositions: null,
    highlightedNodeIds: null,
    resetCamera: false,
    xRayMode: false,
    targetNodeId: null,
    isLoading: false,
    error: null,
    
    // 액션 - 레이아웃 타입 설정
    setLayoutType: (type) => {
      set(state => {
        state.layoutType = type;
        // 레이아웃 변경 시 카메라 리셋
        state.resetCamera = true;
      });
    },
    
    // 액션 - 노드 위치 계산
    calculateNodePositions: (posts) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        
        let positions: NodePosition[];
        
        // 레이아웃 타입에 따라 위치 계산
        if (get().layoutType === 'sphere') {
          positions = calculateSphereLayout(posts);
        } else {
          positions = calculateGridLayout(posts);
        }
        
        set(state => {
          state.nodePositions = positions;
          state.isLoading = false;
        });
      } catch (error: any) {
        set(state => {
          state.error = error.message || '노드 위치 계산 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },
    
    // 액션 - 노드 하이라이트
    highlightNodes: (nodeIds) => {
      set(state => {
        state.highlightedNodeIds = nodeIds;
        
        // 노드 가시성 업데이트
        if (state.nodePositions && nodeIds) {
          state.nodePositions = state.nodePositions.map(node => ({
            ...node,
            visible: nodeIds.includes(node.id)
          }));
        } else if (state.nodePositions) {
          // 하이라이트 해제 시 모든 노드 표시
          state.nodePositions = state.nodePositions.map(node => ({
            ...node,
            visible: true
          }));
        }
      });
    },
    
    // 액션 - 타겟 노드 설정
    setTargetNode: (nodeId) => {
      set(state => { state.targetNodeId = nodeId; });
    },
    
    // 액션 - 카메라 위치 리셋
    resetCameraPosition: () => {
      set(state => {
        state.resetCamera = true;
        // 다음 렌더링에서 리셋 플래그 해제
        setTimeout(() => {
          set(state => { state.resetCamera = false; });
        }, 100);
      });
    },
    
    // 액션 - X-Ray 모드 토글
    toggleXRayMode: () => {
      set(state => { state.xRayMode = !state.xRayMode; });
    },
    
    // 액션 - 오류 초기화
    clearError: () => {
      set(state => { state.error = null; });
    },
  }))
);

/**
 * 선택자 함수가 포함된 레이아웃 스토어
 */
const useLayoutStore = createSelectorFunctions(useLayoutStoreBase);

export { useLayoutStore, type LayoutType, type NodePosition }; 