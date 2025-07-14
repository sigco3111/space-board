/**
 * 레이아웃 관련 상태 관리 스토어
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';

/**
 * 레이아웃 타입 정의
 */
export type LayoutType = 'grid' | 'sphere';

/**
 * 노드 위치 타입 정의 (x, y, z 좌표)
 */
export type NodePosition = [number, number, number];

/**
 * 노드 위치 맵 타입 정의
 */
export type NodePositionMap = {
  [id: string]: NodePosition;
};

/**
 * 레이아웃 상태 인터페이스
 */
export interface LayoutState {
  // 현재 레이아웃 타입
  layout: LayoutType;
  // 레이아웃별 노드 위치 맵
  layouts: {
    grid: NodePositionMap;
    sphere: NodePositionMap;
  };
  // 현재 노드 위치 맵
  nodePositions: NodePositionMap;
  // X-Ray 모드 활성화 여부
  xRayMode: boolean;
  // 카메라 리셋 필요 여부
  resetCam: boolean;
}

/**
 * 레이아웃 액션 인터페이스
 */
export interface LayoutActions {
  // 레이아웃 설정
  setLayout: (layout: LayoutType) => void;
  // 그리드 레이아웃 설정
  setGridLayout: (positions: NodePositionMap) => void;
  // 구체 레이아웃 설정
  setSphereLayout: (positions: NodePositionMap) => void;
  // X-Ray 모드 설정
  setXRayMode: (enabled: boolean) => void;
  // 카메라 리셋 설정
  setResetCam: (reset: boolean) => void;
  // 노드 위치 계산
  calculateNodePositions: (ids: string[]) => void;
}

/**
 * 레이아웃 스토어 타입
 */
export type LayoutStore = LayoutState & LayoutActions;

/**
 * 레이아웃 스토어 생성
 */
export const useLayoutStore = createSelectorFunctions(
  create<LayoutStore>()(
    immer((set, get) => ({
      // 초기 상태
      layout: 'grid',
      layouts: {
        grid: {},
        sphere: {}
      },
      nodePositions: {},
      xRayMode: false,
      resetCam: false,

      // 레이아웃 설정 액션
      setLayout: (layout) => {
        set(state => {
          state.layout = layout;
          state.nodePositions = state.layouts[layout];
          state.resetCam = true;
          return state;
        });
        console.log(`레이아웃 변경: ${layout}`);
      },

      // 그리드 레이아웃 설정 액션
      setGridLayout: (positions) => {
        set(state => {
          state.layouts.grid = positions;
          if (state.layout === 'grid') {
            state.nodePositions = positions;
          }
          return state;
        });
      },

      // 구체 레이아웃 설정 액션
      setSphereLayout: (positions) => {
        set(state => {
          state.layouts.sphere = positions;
          if (state.layout === 'sphere') {
            state.nodePositions = positions;
          }
          return state;
        });
      },

      // X-Ray 모드 설정 액션
      setXRayMode: (enabled) => {
        set(state => {
          state.xRayMode = enabled;
          return state;
        });
      },

      // 카메라 리셋 설정 액션
      setResetCam: (reset) => {
        set(state => {
          state.resetCam = reset;
          return state;
        });
      },

      // 노드 위치 계산 액션
      calculateNodePositions: (ids) => {
        const gridPositions: NodePositionMap = {};
        const spherePositions: NodePositionMap = {};
        
        // 그리드 레이아웃 계산
        const gridSize = Math.ceil(Math.sqrt(ids.length));
        ids.forEach((id, index) => {
          const x = (index % gridSize) / gridSize;
          const y = Math.floor(index / gridSize) / gridSize;
          gridPositions[id] = [x, y, 0.5];
        });
        
        // 구체 레이아웃 계산 (피보나치 구체 알고리즘)
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        ids.forEach((id, index) => {
          const i = index + 1;
          const phi = Math.acos(1 - 2 * i / ids.length);
          const theta = 2 * Math.PI * i / goldenRatio;
          
          const x = 0.5 + 0.4 * Math.sin(phi) * Math.cos(theta);
          const y = 0.5 + 0.4 * Math.sin(phi) * Math.sin(theta);
          const z = 0.5 + 0.4 * Math.cos(phi);
          
          spherePositions[id] = [x, y, z];
        });
        
        set(state => {
          state.layouts.grid = gridPositions;
          state.layouts.sphere = spherePositions;
          state.nodePositions = state.layouts[state.layout];
          return state;
        });
        
        console.log(`노드 위치 계산 완료: ${ids.length}개 노드`);
      }
    }))
  )
);

export default useLayoutStore; 