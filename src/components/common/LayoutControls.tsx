/**
 * 레이아웃 컨트롤 컴포넌트
 * 시각화 레이아웃 전환 및 설정 컨트롤
 */
import React, { useState } from 'react';
import { useLayoutStore } from '../../store';

/**
 * 레이아웃 컨트롤 속성 인터페이스
 */
interface LayoutControlsProps {
  className?: string;
}

/**
 * 레이아웃 컨트롤 컴포넌트
 */
const LayoutControls: React.FC<LayoutControlsProps> = ({ className = '' }) => {
  // 레이아웃 스토어에서 상태 및 액션 가져오기
  const layout = useLayoutStore.use.layout();
  const setLayout = useLayoutStore.use.setLayout();
  const xRayMode = useLayoutStore.use.xRayMode();
  const setXRayMode = useLayoutStore.use.setXRayMode();
  const setResetCam = useLayoutStore.use.setResetCam();
  
  // 전환 애니메이션 상태
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  /**
   * 레이아웃 변경 핸들러
   * @param newLayout 변경할 레이아웃 타입
   */
  const handleLayoutChange = (newLayout: 'grid' | 'sphere') => {
    if (layout !== newLayout && !isTransitioning) {
      // 전환 애니메이션 시작
      setIsTransitioning(true);
      
      // 카메라 리셋
      setResetCam(true);
      
      // 약간의 지연 후 레이아웃 변경
      setTimeout(() => {
        setLayout(newLayout);
        
        // 애니메이션 완료 후 상태 초기화
        setTimeout(() => {
          setIsTransitioning(false);
        }, 1000);
      }, 300);
    }
  };
  
  /**
   * X-Ray 모드 토글 핸들러
   */
  const handleXRayToggle = () => {
    setXRayMode(!xRayMode);
  };
  
  /**
   * 카메라 리셋 핸들러
   */
  const handleResetCamera = () => {
    setResetCam(true);
  };

  return (
    <div className={`layout-controls ${className}`}>
      <button
        className={`layout-button ${layout === 'grid' ? 'active' : ''} ${isTransitioning ? 'disabled' : ''}`}
        onClick={() => handleLayoutChange('grid')}
        disabled={isTransitioning}
        title="그리드 레이아웃"
      >
        <i className="fas fa-th"></i>
        <span className="button-text">그리드</span>
      </button>
      
      <button
        className={`layout-button ${layout === 'sphere' ? 'active' : ''} ${isTransitioning ? 'disabled' : ''}`}
        onClick={() => handleLayoutChange('sphere')}
        disabled={isTransitioning}
        title="구체 레이아웃"
      >
        <i className="fas fa-globe"></i>
        <span className="button-text">구체</span>
      </button>
      
      <button
        className={`layout-button ${xRayMode ? 'active' : ''}`}
        onClick={handleXRayToggle}
        title="X-Ray 모드"
      >
        <i className="fas fa-x-ray"></i>
        <span className="button-text">X-Ray</span>
      </button>
      
      <button
        className="layout-button"
        onClick={handleResetCamera}
        title="카메라 리셋"
      >
        <i className="fas fa-sync-alt"></i>
        <span className="button-text">리셋</span>
      </button>
    </div>
  );
};

export default LayoutControls; 