import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorHooks } from 'auto-zustand-selectors-hook';
import type { VisualizationSettings } from '../types';

/**
 * 시각화 설정 상태 관리를 위한 스토어 타입 정의
 */
interface VisualizationState {
  // 상태
  settings: VisualizationSettings;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  isControlsEnabled: boolean;
  
  // 액션
  updateSettings: (updates: Partial<VisualizationSettings>) => void;
  setCameraPosition: (position: { x: number; y: number; z: number }) => void;
  setCameraTarget: (target: { x: number; y: number; z: number }) => void;
  setControlsEnabled: (enabled: boolean) => void;
  resetCamera: () => void;
}

/**
 * 시각화 설정 상태 관리를 위한 Zustand 스토어
 * 시각화 모드, 카메라 위치, 컨트롤 설정 등을 관리합니다.
 */
const useVisualizationStoreBase = create<VisualizationState>()(
  immer((set) => ({
    // 초기 상태
    settings: {
      mode: 'grid',
      backgroundColor: '#0f172a',
      itemSpacing: 2,
      autoRotate: false,
      showLabels: true,
    },
    cameraPosition: { x: 0, y: 5, z: 10 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    isControlsEnabled: true,

    // 액션
    updateSettings: (updates) => set((state) => {
      state.settings = { ...state.settings, ...updates };
    }),
    
    setCameraPosition: (position) => set((state) => {
      state.cameraPosition = position;
    }),
    
    setCameraTarget: (target) => set((state) => {
      state.cameraTarget = target;
    }),
    
    setControlsEnabled: (enabled) => set((state) => {
      state.isControlsEnabled = enabled;
    }),
    
    resetCamera: () => set((state) => {
      state.cameraPosition = { x: 0, y: 5, z: 10 };
      state.cameraTarget = { x: 0, y: 0, z: 0 };
    }),
  }))
);

// 자동으로 selector를 생성하여 더 편리하게 상태에 접근할 수 있게 함
const useVisualizationStore = createSelectorHooks(useVisualizationStoreBase);

export default useVisualizationStore; 