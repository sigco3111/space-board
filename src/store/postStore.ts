/**
 * 게시물 관련 상태 관리 스토어
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';
import { getAllPosts, Post } from '../services/postService';

/**
 * 게시물 상태 인터페이스
 */
export interface PostState {
  // 게시물 목록
  posts: Post[];
  // 필터링된 게시물 목록
  filteredPosts: Post[];
  // 선택된 게시물 ID
  selectedPostId: string | null;
  // 하이라이트된 게시물 ID 목록
  highlightPostIds: string[];
  // 검색어
  searchQuery: string;
  // 카테고리 필터
  categoryFilter: string | null;
  // 로딩 상태
  isLoading: boolean;
  // 에러 메시지
  error: string | null;
}

/**
 * 게시물 액션 인터페이스
 */
export interface PostActions {
  // 게시물 목록 로드
  loadPosts: () => Promise<void>;
  // 게시물 선택
  selectPost: (postId: string | null) => void;
  // 게시물 하이라이트
  highlightPosts: (postIds: string[]) => void;
  // 하이라이트 초기화
  clearHighlights: () => void;
  // 검색어 설정
  setSearchQuery: (query: string) => void;
  // 카테고리 필터 설정
  setCategoryFilter: (category: string | null) => void;
  // 게시물 필터링
  filterPosts: () => void;
}

/**
 * 게시물 스토어 타입
 */
export type PostStore = PostState & PostActions;

/**
 * 게시물 스토어 생성
 */
export const usePostStore = createSelectorFunctions(
  create<PostStore>()(
    immer((set, get) => ({
      // 초기 상태
      posts: [],
      filteredPosts: [],
      selectedPostId: null,
      highlightPostIds: [],
      searchQuery: '',
      categoryFilter: null,
      isLoading: false,
      error: null,

      // 게시물 목록 로드 액션
      loadPosts: async () => {
        try {
          set(state => {
            state.isLoading = true;
            state.error = null;
            return state;
          });

          console.time('게시물 로딩');
          const posts = await getAllPosts();
          console.timeEnd('게시물 로딩');

          set(state => {
            state.posts = posts;
            state.filteredPosts = posts;
            state.isLoading = false;
            return state;
          });

          console.log(`게시물 ${posts.length}개 로드 완료`);
        } catch (error) {
          console.error('게시물 로드 중 오류 발생:', error);
          
          set(state => {
            state.error = '게시물을 불러오는데 실패했습니다.';
            state.isLoading = false;
            return state;
          });
        }
      },

      // 게시물 선택 액션
      selectPost: (postId) => {
        set(state => {
          state.selectedPostId = postId;
          return state;
        });
      },

      // 게시물 하이라이트 액션
      highlightPosts: (postIds) => {
        set(state => {
          state.highlightPostIds = postIds;
          return state;
        });
      },

      // 하이라이트 초기화 액션
      clearHighlights: () => {
        set(state => {
          state.highlightPostIds = [];
          return state;
        });
      },

      // 검색어 설정 액션
      setSearchQuery: (query) => {
        set(state => {
          state.searchQuery = query;
          return state;
        });
        // 검색어가 변경되면 게시물 필터링
        get().filterPosts();
      },

      // 카테고리 필터 설정 액션
      setCategoryFilter: (category) => {
        set(state => {
          state.categoryFilter = category;
          return state;
        });
        // 카테고리 필터가 변경되면 게시물 필터링
        get().filterPosts();
      },

      // 게시물 필터링 액션
      filterPosts: () => {
        const { posts, searchQuery, categoryFilter } = get();
        
        // 검색어와 카테고리 필터를 적용하여 게시물 필터링
        const filtered = posts.filter(post => {
          // 검색어 필터링 (제목, 내용, 태그에서 검색)
          const matchesSearch = searchQuery === '' || 
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.tags && post.tags.some(tag => 
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            ));
          
          // 카테고리 필터링
          const matchesCategory = categoryFilter === null || 
            post.category === categoryFilter;
          
          return matchesSearch && matchesCategory;
        });
        
        set(state => {
          state.filteredPosts = filtered;
          return state;
        });
        
        // 필터링된 게시물 ID 목록으로 하이라이트 설정
        if (filtered.length > 0 && (searchQuery !== '' || categoryFilter !== null)) {
          const filteredIds = filtered.map(post => post.id);
          set(state => {
            state.highlightPostIds = filteredIds;
            return state;
          });
        } else {
          // 필터가 없으면 하이라이트 초기화
          set(state => {
            state.highlightPostIds = [];
            return state;
          });
        }
        
        console.log(`필터링된 게시물: ${filtered.length}개`);
      }
    }))
  )
);

export default usePostStore; 