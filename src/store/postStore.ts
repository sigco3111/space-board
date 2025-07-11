import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';
import type { Post } from '../types/schema';
import {
  getPosts,
  getPostById,
  getPostsByCategory,
  getPostsByTag,
  getPostsByUser,
  searchPosts,
  createPost,
  updatePost,
  deletePost
} from '../services/postService';

/**
 * 게시물 스토어 상태 인터페이스
 */
interface PostState {
  // 상태 (State)
  posts: Post[] | null;
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  currentCategory: string;
  currentTag: string | null;
  
  // 액션 (Actions)
  fetchPosts: () => Promise<void>;
  fetchPostById: (id: string) => Promise<void>;
  fetchPostsByCategory: (category: string) => Promise<void>;
  fetchPostsByTag: (tag: string) => Promise<void>;
  fetchPostsByUser: (userId: string) => Promise<void>;
  search: (query: string) => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'commentCount' | 'viewCount'>) => Promise<string | null>;
  editPost: (id: string, updates: Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'commentCount' | 'viewCount'>>) => Promise<boolean>;
  removePost: (id: string) => Promise<boolean>;
  setCurrentPost: (post: Post | null) => void;
  clearError: () => void;
  setSearchQuery: (query: string) => void;
  setCurrentCategory: (category: string) => void;
  setCurrentTag: (tag: string | null) => void;
}

/**
 * 게시물 관련 상태를 관리하는 스토어
 */
const usePostStoreBase = create<PostState>()(
  immer((set, get) => ({
    // 초기 상태
    posts: null,
    currentPost: null,
    isLoading: false,
    error: null,
    searchQuery: '',
    currentCategory: 'all',
    currentTag: null,

    // 액션 - 게시물 목록 조회
    fetchPosts: async () => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const posts = await getPosts();
        set(state => { state.posts = posts; state.isLoading = false; });
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '게시물을 불러오는 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },

    // 액션 - 게시물 상세 조회
    fetchPostById: async (id: string) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const post = await getPostById(id);
        set(state => { state.currentPost = post; state.isLoading = false; });
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '게시물을 불러오는 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },

    // 액션 - 카테고리별 게시물 조회
    fetchPostsByCategory: async (category: string) => {
      try {
        set(state => { 
          state.isLoading = true; 
          state.error = null;
          state.currentCategory = category;
          state.currentTag = null;
        });
        
        let posts;
        if (category === 'all') {
          posts = await getPosts();
        } else {
          posts = await getPostsByCategory(category);
        }
        
        set(state => { state.posts = posts; state.isLoading = false; });
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '게시물을 불러오는 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },

    // 액션 - 태그별 게시물 조회
    fetchPostsByTag: async (tag: string) => {
      try {
        set(state => { 
          state.isLoading = true; 
          state.error = null;
          state.currentTag = tag;
        });
        
        const posts = await getPostsByTag(tag);
        set(state => { state.posts = posts; state.isLoading = false; });
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '게시물을 불러오는 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },

    // 액션 - 사용자별 게시물 조회
    fetchPostsByUser: async (userId: string) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const posts = await getPostsByUser(userId);
        set(state => { state.posts = posts; state.isLoading = false; });
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '게시물을 불러오는 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },

    // 액션 - 게시물 검색
    search: async (query: string) => {
      try {
        set(state => { 
          state.isLoading = true; 
          state.error = null;
          state.searchQuery = query;
        });
        
        const posts = await searchPosts(query);
        set(state => { state.posts = posts; state.isLoading = false; });
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '게시물 검색 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },

    // 액션 - 게시물 생성
    addPost: async (post) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const postId = await createPost(post);
        
        // 생성된 게시물 조회 및 목록에 추가
        const newPost = await getPostById(postId, false);
        set(state => { 
          if (state.posts) {
            state.posts = [newPost, ...state.posts];
          } else {
            state.posts = [newPost];
          }
          state.isLoading = false;
        });
        
        return postId;
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '게시물 생성 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return null;
      }
    },

    // 액션 - 게시물 수정
    editPost: async (id, updates) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const success = await updatePost(id, updates);
        
        if (success) {
          // 수정된 게시물 조회 및 목록 업데이트
          const updatedPost = await getPostById(id, false);
          
          set(state => { 
            // 현재 보고 있는 게시물인 경우 업데이트
            if (state.currentPost && state.currentPost.id === id) {
              state.currentPost = updatedPost;
            }
            
            // 목록에 있는 게시물인 경우 업데이트
            if (state.posts) {
              state.posts = state.posts.map(post => 
                post.id === id ? updatedPost : post
              );
            }
            
            state.isLoading = false;
          });
        } else {
          set(state => { state.isLoading = false; });
        }
        
        return success;
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '게시물 수정 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return false;
      }
    },

    // 액션 - 게시물 삭제
    removePost: async (id) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const success = await deletePost(id);
        
        if (success) {
          set(state => { 
            // 현재 보고 있는 게시물인 경우 초기화
            if (state.currentPost && state.currentPost.id === id) {
              state.currentPost = null;
            }
            
            // 목록에서 제거
            if (state.posts) {
              state.posts = state.posts.filter(post => post.id !== id);
            }
            
            state.isLoading = false;
          });
        } else {
          set(state => { state.isLoading = false; });
        }
        
        return success;
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '게시물 삭제 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return false;
      }
    },

    // 액션 - 현재 게시물 설정
    setCurrentPost: (post) => {
      set(state => { state.currentPost = post; });
    },

    // 액션 - 오류 초기화
    clearError: () => {
      set(state => { state.error = null; });
    },

    // 액션 - 검색어 설정
    setSearchQuery: (query) => {
      set(state => { state.searchQuery = query; });
    },

    // 액션 - 현재 카테고리 설정
    setCurrentCategory: (category) => {
      set(state => { state.currentCategory = category; });
    },

    // 액션 - 현재 태그 설정
    setCurrentTag: (tag) => {
      set(state => { state.currentTag = tag; });
    },
  }))
);

/**
 * 선택자 함수가 포함된 게시물 스토어
 */
const usePostStore = createSelectorFunctions(usePostStoreBase);

export { usePostStore }; 