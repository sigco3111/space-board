import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';
import type { Comment } from '../types/schema';
import {
  getCommentsByPostId,
  getCommentById,
  createComment,
  updateComment,
  deleteComment
} from '../services/commentService';

/**
 * 댓글 스토어 상태 인터페이스
 */
interface CommentState {
  // 상태 (State)
  comments: Comment[] | null;
  currentComment: Comment | null;
  isLoading: boolean;
  error: string | null;
  
  // 액션 (Actions)
  fetchCommentsByPostId: (postId: string) => Promise<void>;
  fetchCommentById: (id: string) => Promise<void>;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  editComment: (id: string, content: string) => Promise<boolean>;
  removeComment: (id: string) => Promise<boolean>;
  setCurrentComment: (comment: Comment | null) => void;
  clearComments: () => void;
  clearError: () => void;
}

/**
 * 댓글 관련 상태를 관리하는 스토어
 */
const useCommentStoreBase = create<CommentState>()(
  immer((set, get) => ({
    // 초기 상태
    comments: null,
    currentComment: null,
    isLoading: false,
    error: null,
    
    // 액션 - 게시물별 댓글 목록 조회
    fetchCommentsByPostId: async (postId) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const comments = await getCommentsByPostId(postId);
        set(state => { state.comments = comments; state.isLoading = false; });
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '댓글을 불러오는 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },
    
    // 액션 - 댓글 상세 조회
    fetchCommentById: async (id) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const comment = await getCommentById(id);
        set(state => { state.currentComment = comment; state.isLoading = false; });
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '댓글을 불러오는 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
      }
    },
    
    // 액션 - 댓글 생성
    addComment: async (comment) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const commentId = await createComment(comment);
        
        // 생성된 댓글 조회 및 목록에 추가
        const newComment = await getCommentById(commentId);
        set(state => { 
          if (state.comments) {
            state.comments = [...state.comments, newComment];
          } else {
            state.comments = [newComment];
          }
          state.isLoading = false;
        });
        
        return commentId;
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '댓글 생성 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return null;
      }
    },
    
    // 액션 - 댓글 수정
    editComment: async (id, content) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const success = await updateComment(id, { content });
        
        if (success) {
          // 수정된 댓글 조회 및 목록 업데이트
          const updatedComment = await getCommentById(id);
          
          set(state => { 
            // 현재 보고 있는 댓글인 경우 업데이트
            if (state.currentComment && state.currentComment.id === id) {
              state.currentComment = updatedComment;
            }
            
            // 목록에 있는 댓글인 경우 업데이트
            if (state.comments) {
              state.comments = state.comments.map(comment => 
                comment.id === id ? updatedComment : comment
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
          state.error = error.message || '댓글 수정 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return false;
      }
    },
    
    // 액션 - 댓글 삭제
    removeComment: async (id) => {
      try {
        set(state => { state.isLoading = true; state.error = null; });
        const success = await deleteComment(id);
        
        if (success) {
          set(state => { 
            // 현재 보고 있는 댓글인 경우 초기화
            if (state.currentComment && state.currentComment.id === id) {
              state.currentComment = null;
            }
            
            // 목록에서 제거
            if (state.comments) {
              state.comments = state.comments.filter(comment => comment.id !== id);
            }
            
            state.isLoading = false;
          });
        } else {
          set(state => { state.isLoading = false; });
        }
        
        return success;
      } catch (error: any) {
        set(state => { 
          state.error = error.message || '댓글 삭제 중 오류가 발생했습니다.';
          state.isLoading = false;
        });
        return false;
      }
    },
    
    // 액션 - 현재 댓글 설정
    setCurrentComment: (comment) => {
      set(state => { state.currentComment = comment; });
    },
    
    // 액션 - 댓글 목록 초기화
    clearComments: () => {
      set(state => { state.comments = null; });
    },
    
    // 액션 - 오류 초기화
    clearError: () => {
      set(state => { state.error = null; });
    },
  }))
);

/**
 * 선택자 함수가 포함된 댓글 스토어
 */
const useCommentStore = createSelectorFunctions(useCommentStoreBase);

export { useCommentStore }; 