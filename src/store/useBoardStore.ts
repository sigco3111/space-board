import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorHooks } from 'auto-zustand-selectors-hook';
import type { Board, BoardItem } from '../types';

/**
 * 보드 상태 관리를 위한 스토어 타입 정의
 */
interface BoardState {
  // 상태
  boards: Board[];
  currentBoard: Board | null;
  selectedItem: BoardItem | null;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  setBoards: (boards: Board[]) => void;
  setCurrentBoard: (board: Board | null) => void;
  setSelectedItem: (item: BoardItem | null) => void;
  addBoard: (board: Board) => void;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteBoard: (boardId: string) => void;
  addItem: (boardId: string, item: BoardItem) => void;
  updateItem: (boardId: string, itemId: string, updates: Partial<BoardItem>) => void;
  deleteItem: (boardId: string, itemId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * 보드 상태 관리를 위한 Zustand 스토어
 * 보드 목록, 현재 보드, 선택된 아이템 등을 관리합니다.
 */
const useBoardStoreBase = create<BoardState>()(
  immer((set) => ({
    // 초기 상태
    boards: [],
    currentBoard: null,
    selectedItem: null,
    isLoading: false,
    error: null,

    // 액션
    setBoards: (boards) => set((state) => {
      state.boards = boards;
    }),
    
    setCurrentBoard: (board) => set((state) => {
      state.currentBoard = board;
      // 보드가 변경되면 선택된 아이템 초기화
      state.selectedItem = null;
    }),
    
    setSelectedItem: (item) => set((state) => {
      state.selectedItem = item;
    }),
    
    addBoard: (board) => set((state) => {
      state.boards.push(board);
    }),
    
    updateBoard: (boardId, updates) => set((state) => {
      const boardIndex = state.boards.findIndex(board => board.id === boardId);
      if (boardIndex !== -1) {
        // 기존 보드에 업데이트 적용
        state.boards[boardIndex] = { ...state.boards[boardIndex], ...updates };
        
        // 현재 보드가 업데이트된 보드인 경우 현재 보드도 업데이트
        if (state.currentBoard?.id === boardId) {
          state.currentBoard = { ...state.currentBoard, ...updates };
        }
      }
    }),
    
    deleteBoard: (boardId) => set((state) => {
      state.boards = state.boards.filter(board => board.id !== boardId);
      
      // 현재 보드가 삭제된 보드인 경우 현재 보드 초기화
      if (state.currentBoard?.id === boardId) {
        state.currentBoard = null;
        state.selectedItem = null;
      }
    }),
    
    addItem: (boardId, item) => set((state) => {
      const boardIndex = state.boards.findIndex(board => board.id === boardId);
      if (boardIndex !== -1) {
        state.boards[boardIndex].items.push(item);
        
        // 현재 보드가 업데이트된 보드인 경우 현재 보드도 업데이트
        if (state.currentBoard?.id === boardId) {
          state.currentBoard.items.push(item);
        }
      }
    }),
    
    updateItem: (boardId, itemId, updates) => set((state) => {
      const boardIndex = state.boards.findIndex(board => board.id === boardId);
      if (boardIndex !== -1) {
        const itemIndex = state.boards[boardIndex].items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
          // 기존 아이템에 업데이트 적용
          state.boards[boardIndex].items[itemIndex] = { 
            ...state.boards[boardIndex].items[itemIndex], 
            ...updates 
          };
          
          // 현재 보드가 업데이트된 보드인 경우 현재 보드도 업데이트
          if (state.currentBoard?.id === boardId) {
            const currentItemIndex = state.currentBoard.items.findIndex(item => item.id === itemId);
            if (currentItemIndex !== -1) {
              state.currentBoard.items[currentItemIndex] = {
                ...state.currentBoard.items[currentItemIndex],
                ...updates
              };
            }
          }
          
          // 선택된 아이템이 업데이트된 아이템인 경우 선택된 아이템도 업데이트
          if (state.selectedItem?.id === itemId) {
            state.selectedItem = { ...state.selectedItem, ...updates };
          }
        }
      }
    }),
    
    deleteItem: (boardId, itemId) => set((state) => {
      const boardIndex = state.boards.findIndex(board => board.id === boardId);
      if (boardIndex !== -1) {
        state.boards[boardIndex].items = state.boards[boardIndex].items.filter(item => item.id !== itemId);
        
        // 현재 보드가 업데이트된 보드인 경우 현재 보드도 업데이트
        if (state.currentBoard?.id === boardId) {
          state.currentBoard.items = state.currentBoard.items.filter(item => item.id !== itemId);
        }
        
        // 선택된 아이템이 삭제된 아이템인 경우 선택된 아이템 초기화
        if (state.selectedItem?.id === itemId) {
          state.selectedItem = null;
        }
      }
    }),
    
    setLoading: (isLoading) => set((state) => {
      state.isLoading = isLoading;
    }),
    
    setError: (error) => set((state) => {
      state.error = error;
    }),
    
    clearError: () => set((state) => {
      state.error = null;
    }),
  }))
);

// 자동으로 selector를 생성하여 더 편리하게 상태에 접근할 수 있게 함
const useBoardStore = createSelectorHooks(useBoardStoreBase);

export default useBoardStore; 