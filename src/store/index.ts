/**
 * 스토어 모듈 인덱스
 * 애플리케이션의 전역 상태 관리를 위한 Zustand 스토어 설정
 */
import 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';

// 스토어 모듈 내보내기
export * from './postStore';
export * from './layoutStore';
export * from './uiStore';

/**
 * 전역 상태 타입 정의
 */
export interface RootState {
  // 초기화 상태
  didInit: boolean;
}

/**
 * 루트 스토어 생성
 * immer 미들웨어를 사용하여 불변성 관리
 */
export const useRootStore = createSelectorFunctions(
  create(
    immer<RootState>(() => ({
      didInit: false,
    }))
  )
);

/**
 * 스토어 초기화 함수
 */
export const initStore = () => {
  const get = useRootStore.getState;
  const set = useRootStore.setState;

  // 이미 초기화된 경우 중복 실행 방지
  if (get().didInit) {
    return;
  }

  // 초기화 완료 표시
  set(state => {
    state.didInit = true;
    return state; // 상태 반환 추가
  });

  console.log('스토어 초기화 완료');
};

// 스토어 자동 초기화
initStore();

export default useRootStore; 