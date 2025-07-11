import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';
import type { Bookmark } from '../types/schema';
import {
  getBookmarksByUserId,
  getBookmarkedPostsByUserId,
  checkBookmark,
  addBookmark,
  removeBookmark,
  toggleBookmark
} from '../services/bookmarkService';

/**
 * 북마크 스토어 상태 인터페이스
 */
interface BookmarkState {
  // 상태 (State)
  bookmarks: Bookmark[] | null;
  isLoading: boolean;
  error: string | null;
  
  // 액션 (Actions)
  fetchBookmarksByUserId: (userId: string) => Promise<void>;
  checkIfBookmarked: (userId: string, postId: string) => Promise<{ isBookmarked: boolean; bookmarkId?: string }>;
  addBookmark: (userId: string, postId: string) => Promise<string | null>;
  removeBookmark: (userId: string, postId: string) => Promise<boolean>;
  toggleBookmark: (userId: string, postId: string) => Promise<{ isBookmarked: boolean; bookmarkId?: string } | null>;
  clearBookmarks: () => void;
  clearError: () => void;
}

/**
 * 북마크 관련 상태를 관리하는 스토어
 */
const useBookmarkStoreBase = create<BookmarkState>()(
  immer((set, get) => ({
    // 초기 상태
    bookmarks: null,
    isLoading: false,
    error: null,
    
    // 액션 - 사용자별 북마크 목록 조회
    fetchBookmarksByUserId: async (userId) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const bookmarks = await getBookmarksByUserId(userId);
        set(state => { state.bookmarks = bookmarks; state.isLoading = false; });
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '북마크를 불러오는 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },
    
    // 액션 - 북마크 여부 확인
    checkIfBookmarked: async (userId, postId) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const result = await checkBookmark(userId, postId);
        set(state => { state.isLoading = false; });
        return result;
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '북마크 확인 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return { isBookmarked: false };
      }
    },
    
    // 액션 - 북마크 생성
    addBookmark: async (userId, postId) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const bookmarkId = await addBookmark(userId, postId);
        
        // 북마크 목록 갱신
        if (get().bookmarks) {
          const bookmarks = await getBookmarksByUserId(userId);
          set(state => { state.bookmarks = bookmarks; });
        }
        
        set(state => { state.isLoading = false; });
        return bookmarkId;
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '북마크 생성 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return null;
      }
    },
    
    // 액션 - 북마크 삭제
    removeBookmark: async (userId, postId) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const success = await removeBookmark(userId, postId);
        
        if (success && get().bookmarks) {
          // 북마크 목록에서 제거
          const bookmarks = await getBookmarksByUserId(userId);
          set(state => { state.bookmarks = bookmarks; });
        }
        
        set(state => { state.isLoading = false; });
        return success;
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '북마크 삭제 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return false;
      }
    },
    
    // 액션 - 북마크 토글
    toggleBookmark: async (userId, postId) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const result = await toggleBookmark(userId, postId);
        
        // 북마크 목록 갱신
        if (get().bookmarks) {
          const bookmarks = await getBookmarksByUserId(userId);
          set(state => { state.bookmarks = bookmarks; });
        }
        
        set(state => { state.isLoading = false; });
        return result;
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '북마크 토글 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return null;
      }
    },
    
    // 액션 - 북마크 목록 초기화
    clearBookmarks: () => {
      set(state => { state.bookmarks = null; });
    },
    
    // 액션 - 오류 초기화
    clearError: () => {
      set(state => { state.error = null; });
    },
  }))
);

/**
 * 선택자 함수가 포함된 북마크 스토어
 */
const useBookmarkStore = createSelectorFunctions(useBookmarkStoreBase);

export { useBookmarkStore }; 