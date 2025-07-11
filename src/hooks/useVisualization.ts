import { useCallback, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import useVisualizationStore from '../store/useVisualizationStore';
import type { BoardItem } from '../types';

/**
 * 시각화 관련 기능을 제공하는 커스텀 훅
 * 아이템 배치, 카메라 제어, 시각화 모드 관리 등의 기능을 제공합니다.
 */
const useVisualization = (items: BoardItem[] = []) => {
  // 상태 관리 스토어에서 필요한 값과 액션 가져오기
  const { 
    settings, 
    cameraPosition, 
    cameraTarget, 
    isControlsEnabled 
  } = useVisualizationStore();
  
  const {
    updateSettings,
    setCameraPosition,
    setCameraTarget,
    setControlsEnabled,
    resetCamera,
  } = useVisualizationStore();
  
  // 아이템 위치 계산 결과 (캐시)
  const [itemPositions, setItemPositions] = useState<Record<string, Vector3>>({});
  
  // Three.js 카메라 및 컨트롤
  const { camera, controls } = useThree(state => ({
    camera: state.camera,
    controls: state.controls,
  }));
  
  /**
   * 시각화 모드 변경
   */
  const changeVisualizationMode = useCallback(
    (mode: 'grid' | 'sphere' | 'cluster') => {
      updateSettings({ mode });
      // 모드 변경 시 아이템 위치 재계산
      calculateItemPositions();
    },
    [updateSettings]
  );
  
  /**
   * 배경색 변경
   */
  const changeBackgroundColor = useCallback(
    (backgroundColor: string) => {
      updateSettings({ backgroundColor });
    },
    [updateSettings]
  );
  
  /**
   * 아이템 간격 변경
   */
  const changeItemSpacing = useCallback(
    (itemSpacing: number) => {
      updateSettings({ itemSpacing });
      // 간격 변경 시 아이템 위치 재계산
      calculateItemPositions();
    },
    [updateSettings]
  );
  
  /**
   * 자동 회전 설정 변경
   */
  const toggleAutoRotate = useCallback(
    (autoRotate: boolean) => {
      updateSettings({ autoRotate });
      
      // Three.js 컨트롤이 있는 경우 설정 적용
      if (controls) {
        (controls as any).autoRotate = autoRotate;
      }
    },
    [updateSettings, controls]
  );
  
  /**
   * 라벨 표시 설정 변경
   */
  const toggleLabels = useCallback(
    (showLabels: boolean) => {
      updateSettings({ showLabels });
    },
    [updateSettings]
  );
  
  /**
   * 카메라 위치 설정
   */
  const moveCameraTo = useCallback(
    (position: { x: number; y: number; z: number }) => {
      setCameraPosition(position);
      
      // Three.js 카메라가 있는 경우 위치 적용
      if (camera) {
        camera.position.set(position.x, position.y, position.z);
      }
    },
    [setCameraPosition, camera]
  );
  
  /**
   * 카메라 타겟 설정
   */
  const lookAt = useCallback(
    (target: { x: number; y: number; z: number }) => {
      setCameraTarget(target);
      
      // Three.js 컨트롤이 있는 경우 타겟 적용
      if (controls) {
        (controls as any).target.set(target.x, target.y, target.z);
        (controls as any).update();
      } else if (camera) {
        // 컨트롤이 없는 경우 카메라 직접 조작
        camera.lookAt(target.x, target.y, target.z);
      }
    },
    [setCameraTarget, controls, camera]
  );
  
  /**
   * 컨트롤 활성화/비활성화 설정
   */
  const enableControls = useCallback(
    (enabled: boolean) => {
      setControlsEnabled(enabled);
      
      // Three.js 컨트롤이 있는 경우 설정 적용
      if (controls) {
        (controls as any).enabled = enabled;
      }
    },
    [setControlsEnabled, controls]
  );
  
  /**
   * 카메라 초기화
   */
  const resetCameraPosition = useCallback(() => {
    resetCamera();
    
    // Three.js 카메라 및 컨트롤이 있는 경우 초기화
    if (camera) {
      camera.position.set(0, 5, 10);
      
      if (controls) {
        (controls as any).target.set(0, 0, 0);
        (controls as any).update();
      } else {
        camera.lookAt(0, 0, 0);
      }
    }
  }, [resetCamera, camera, controls]);
  
  /**
   * 아이템 위치 계산
   * 시각화 모드에 따라 아이템 위치를 계산합니다.
   */
  const calculateItemPositions = useCallback(() => {
    if (!items || items.length === 0) return;
    
    const positions: Record<string, Vector3> = {};
    const { mode, itemSpacing } = settings;
    
    switch (mode) {
      case 'grid': {
        // 그리드 레이아웃 (2D 그리드)
        const gridSize = Math.ceil(Math.sqrt(items.length));
        const offset = (gridSize - 1) * itemSpacing / 2;
        
        items.forEach((item, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          
          positions[item.id] = new Vector3(
            col * itemSpacing - offset,
            0,
            row * itemSpacing - offset
          );
        });
        break;
      }
      
      case 'sphere': {
        // 구형 레이아웃
        const count = items.length;
        const phi = Math.PI * (3 - Math.sqrt(5)); // 황금각
        
        items.forEach((item, index) => {
          const y = 1 - (index / (count - 1)) * 2; // -1에서 1 사이의 값
          const radius = Math.sqrt(1 - y * y) * 3 * itemSpacing; // 구의 반지름
          const theta = phi * index; // 각도
          
          positions[item.id] = new Vector3(
            radius * Math.cos(theta),
            y * 3 * itemSpacing,
            radius * Math.sin(theta)
          );
        });
        break;
      }
      
      case 'cluster': {
        // 클러스터 레이아웃 (타입별 그룹화)
        const typeGroups: Record<string, BoardItem[]> = {};
        
        // 아이템을 타입별로 그룹화
        items.forEach(item => {
          if (!typeGroups[item.type]) {
            typeGroups[item.type] = [];
          }
          typeGroups[item.type].push(item);
        });
        
        // 각 타입 그룹의 중심 위치 계산
        const typePositions: Record<string, Vector3> = {
          text: new Vector3(-itemSpacing * 3, 0, 0),
          image: new Vector3(itemSpacing * 3, 0, 0),
          link: new Vector3(0, 0, -itemSpacing * 3),
          embed: new Vector3(0, 0, itemSpacing * 3),
        };
        
        // 각 그룹 내에서 아이템 배치
        Object.entries(typeGroups).forEach(([type, groupItems]) => {
          const center = typePositions[type] || new Vector3(0, 0, 0);
          const groupSize = Math.ceil(Math.sqrt(groupItems.length));
          const groupOffset = (groupSize - 1) * (itemSpacing / 2) / 2;
          
          groupItems.forEach((item, index) => {
            const row = Math.floor(index / groupSize);
            const col = index % groupSize;
            
            positions[item.id] = new Vector3(
              center.x + (col * (itemSpacing / 2) - groupOffset),
              center.y,
              center.z + (row * (itemSpacing / 2) - groupOffset)
            );
          });
        });
        break;
      }
    }
    
    setItemPositions(positions);
    return positions;
  }, [items, settings]);
  
  // 아이템이나 설정이 변경될 때 위치 재계산
  useEffect(() => {
    calculateItemPositions();
  }, [items, settings.mode, settings.itemSpacing, calculateItemPositions]);
  
  // 컴포넌트 마운트 시 Three.js 설정 적용
  useEffect(() => {
    if (controls) {
      (controls as any).autoRotate = settings.autoRotate;
      (controls as any).enabled = isControlsEnabled;
      (controls as any).target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      (controls as any).update();
    }
    
    if (camera) {
      camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      
      if (!controls) {
        camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      }
    }
  }, [controls, camera, settings.autoRotate, isControlsEnabled, cameraPosition, cameraTarget]);
  
  return {
    settings,
    itemPositions,
    changeVisualizationMode,
    changeBackgroundColor,
    changeItemSpacing,
    toggleAutoRotate,
    toggleLabels,
    moveCameraTo,
    lookAt,
    enableControls,
    resetCameraPosition,
    calculateItemPositions,
  };
};

export default useVisualization; 