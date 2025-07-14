/**
 * UI 관련 상태 관리 스토어
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';

/**
 * UI 상태 인터페이스
 */
export interface UIState {
  // 사이드바 열림 여부
  isSidebarOpen: boolean;
  // 데이터 로딩 중 여부
  isFetching: boolean;
  // 캡션 텍스트
  caption: string | null;
  // 검색어
  searchQuery: string;
}

/**
 * UI 액션 인터페이스
 */
export interface UIActions {
  // 사이드바 열기/닫기
  setSidebarOpen: (isOpen: boolean) => void;
  // 사이드바 토글
  toggleSidebar: () => void;
  // 로딩 상태 설정
  setFetching: (isFetching: boolean) => void;
  // 캡션 설정
  setCaption: (caption: string | null) => void;
  // 검색어 설정
  setSearchQuery: (query: string) => void;
  // 검색어 초기화
  clearSearchQuery: () => void;
}

/**
 * UI 스토어 타입
 */
export type UIStore = UIState & UIActions;

/**
 * UI 스토어 생성
 */
export const useUIStore = createSelectorFunctions(
  create<UIStore>()(
    immer((set, get) => ({
      // 초기 상태
      isSidebarOpen: false,
      isFetching: false,
      caption: null,
      searchQuery: '',

      // 사이드바 열기/닫기 액션
      setSidebarOpen: (isOpen) => {
        set(state => {
          state.isSidebarOpen = isOpen;
          return state;
        });
      },

      // 사이드바 토글 액션
      toggleSidebar: () => {
        set(state => {
          state.isSidebarOpen = !state.isSidebarOpen;
          return state;
        });
      },

      // 로딩 상태 설정 액션
      setFetching: (isFetching) => {
        set(state => {
          state.isFetching = isFetching;
          return state;
        });
      },

      // 캡션 설정 액션
      setCaption: (caption) => {
        set(state => {
          state.caption = caption;
          return state;
        });
      },

      // 검색어 설정 액션
      setSearchQuery: (query) => {
        set(state => {
          state.searchQuery = query;
          return state;
        });
      },

      // 검색어 초기화 액션
      clearSearchQuery: () => {
        set(state => {
          state.searchQuery = '';
          state.caption = null;
          return state;
        });
      }
    }))
  )
);

export default useUIStore; 