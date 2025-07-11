import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';

/**
 * 모달 타입 정의
 */
type ModalType = 'post-create' | 'post-edit' | 'post-detail' | 'comment' | 'login' | 'none';

/**
 * 알림 타입 정의
 */
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // 밀리초 단위, 기본값: 3000ms
}

/**
 * UI 스토어 상태 인터페이스
 */
interface UIState {
  // 상태 (State)
  isSidebarOpen: boolean;
  isLoading: boolean;
  currentModal: ModalType;
  modalData: any;
  notifications: Notification[];
  theme: 'light' | 'dark';
  
  // 액션 (Actions)
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setLoading: (isLoading: boolean) => void;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

/**
 * 고유 ID 생성 함수
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * UI 관련 상태를 관리하는 스토어
 */
const useUIStoreBase = create<UIState>()(
  immer((set, get) => ({
    // 초기 상태
    isSidebarOpen: false,
    isLoading: false,
    currentModal: 'none',
    modalData: null,
    notifications: [],
    theme: 'light',
    
    // 액션 - 사이드바 토글
    toggleSidebar: () => {
      set(state => { state.isSidebarOpen = !state.isSidebarOpen; });
    },
    
    // 액션 - 사이드바 열기
    openSidebar: () => {
      set(state => { state.isSidebarOpen = true; });
    },
    
    // 액션 - 사이드바 닫기
    closeSidebar: () => {
      set(state => { state.isSidebarOpen = false; });
    },
    
    // 액션 - 로딩 상태 설정
    setLoading: (isLoading) => {
      set(state => { state.isLoading = isLoading; });
    },
    
    // 액션 - 모달 열기
    openModal: (type, data = null) => {
      set(state => {
        state.currentModal = type;
        state.modalData = data;
      });
    },
    
    // 액션 - 모달 닫기
    closeModal: () => {
      set(state => {
        state.currentModal = 'none';
        state.modalData = null;
      });
    },
    
    // 액션 - 알림 추가
    addNotification: (notification) => {
      const id = generateId();
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration || 3000
      };
      
      set(state => {
        state.notifications.push(newNotification);
      });
      
      // 지정된 시간 후 자동으로 알림 제거
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
      
      return id;
    },
    
    // 액션 - 알림 제거
    removeNotification: (id) => {
      set(state => {
        state.notifications = state.notifications.filter(
          notification => notification.id !== id
        );
      });
    },
    
    // 액션 - 테마 설정
    setTheme: (theme) => {
      set(state => { state.theme = theme; });
      
      // HTML 요소에 테마 클래스 추가
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // 로컬 스토리지에 테마 저장
      localStorage.setItem('theme', theme);
    },
    
    // 액션 - 테마 토글
    toggleTheme: () => {
      const newTheme = get().theme === 'light' ? 'dark' : 'light';
      get().setTheme(newTheme);
    }
  }))
);

/**
 * 선택자 함수가 포함된 UI 스토어
 */
const useUIStore = createSelectorFunctions(useUIStoreBase);

/**
 * 앱 초기화 시 로컬 스토리지에서 테마 설정 불러오기
 */
export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  
  if (savedTheme) {
    useUIStore.getState().setTheme(savedTheme);
  } else {
    // 시스템 테마 감지
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    useUIStore.getState().setTheme(prefersDark ? 'dark' : 'light');
  }
};

export { useUIStore, type ModalType, type Notification }; 