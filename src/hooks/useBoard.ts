import { useCallback } from 'react';
import {
  getUserBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  addItemToBoard,
  updateBoardItem,
  deleteBoardItem,
  uploadImageAndAddToBoard,
} from '../services/board';
import useBoardStore from '../store/useBoardStore';
import type { Board, BoardItem } from '../types';

/**
 * 보드 관련 기능을 제공하는 커스텀 훅
 * 보드 생성, 조회, 수정, 삭제 및 아이템 관리 기능을 제공합니다.
 */
const useBoard = () => {
  // 상태 관리 스토어에서 필요한 값과 액션 가져오기
  const { 
    boards, 
    currentBoard, 
    selectedItem, 
    isLoading, 
    error 
  } = useBoardStore();
  
  const {
    setBoards,
    setCurrentBoard,
    setSelectedItem,
    addBoard: addBoardToStore,
    updateBoard: updateBoardInStore,
    deleteBoard: deleteBoardFromStore,
    addItem: addItemToStore,
    updateItem: updateItemInStore,
    deleteItem: deleteItemFromStore,
    setLoading,
    setError,
    clearError,
  } = useBoardStore();

  /**
   * 사용자의 모든 보드 가져오기
   */
  const fetchUserBoards = useCallback(
    async (userId: string): Promise<Board[]> => {
      clearError();
      setLoading(true);
      
      try {
        const boards = await getUserBoards(userId);
        setBoards(boards);
        return boards;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setBoards, setError]
  );

  /**
   * 특정 보드 상세 정보 가져오기
   */
  const fetchBoardById = useCallback(
    async (boardId: string): Promise<Board> => {
      clearError();
      setLoading(true);
      
      try {
        const board = await getBoardById(boardId);
        setCurrentBoard(board);
        return board;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setCurrentBoard, setError]
  );

  /**
   * 새 보드 생성
   */
  const createNewBoard = useCallback(
    async (userId: string, title: string, description: string = '', isPublic: boolean = false): Promise<Board> => {
      clearError();
      setLoading(true);
      
      try {
        const newBoard = await createBoard(userId, title, description, isPublic);
        addBoardToStore(newBoard);
        setCurrentBoard(newBoard);
        return newBoard;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, addBoardToStore, setCurrentBoard, setError]
  );

  /**
   * 보드 정보 업데이트
   */
  const updateBoardInfo = useCallback(
    async (boardId: string, updates: Partial<Omit<Board, 'id' | 'userId' | 'createdAt' | 'items'>>): Promise<Board> => {
      clearError();
      setLoading(true);
      
      try {
        const updatedBoard = await updateBoard(boardId, updates);
        updateBoardInStore(boardId, updates);
        
        // 현재 보드가 업데이트된 보드인 경우 현재 보드도 업데이트
        if (currentBoard?.id === boardId) {
          setCurrentBoard(updatedBoard);
        }
        
        return updatedBoard;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, updateBoardInStore, setCurrentBoard, currentBoard, setError]
  );

  /**
   * 보드 삭제
   */
  const removeBoard = useCallback(
    async (boardId: string): Promise<void> => {
      clearError();
      setLoading(true);
      
      try {
        await deleteBoard(boardId);
        deleteBoardFromStore(boardId);
        
        // 현재 보드가 삭제된 보드인 경우 현재 보드 초기화
        if (currentBoard?.id === boardId) {
          setCurrentBoard(null);
          setSelectedItem(null);
        }
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, deleteBoardFromStore, setCurrentBoard, currentBoard, setSelectedItem, setError]
  );

  /**
   * 보드에 아이템 추가
   */
  const addItem = useCallback(
    async (boardId: string, item: Omit<BoardItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      clearError();
      setLoading(true);
      
      try {
        const itemId = await addItemToBoard(boardId, item);
        
        // 보드 정보 다시 가져오기
        const updatedBoard = await getBoardById(boardId);
        updateBoardInStore(boardId, { items: updatedBoard.items });
        
        // 현재 보드가 업데이트된 보드인 경우 현재 보드도 업데이트
        if (currentBoard?.id === boardId) {
          setCurrentBoard(updatedBoard);
        }
        
        return itemId;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, updateBoardInStore, setCurrentBoard, currentBoard, setError]
  );

  /**
   * 보드의 아이템 업데이트
   */
  const updateItem = useCallback(
    async (boardId: string, itemId: string, updates: Partial<Omit<BoardItem, 'id' | 'userId' | 'createdAt'>>): Promise<void> => {
      clearError();
      setLoading(true);
      
      try {
        await updateBoardItem(boardId, itemId, updates);
        
        // 보드 정보 다시 가져오기
        const updatedBoard = await getBoardById(boardId);
        updateBoardInStore(boardId, { items: updatedBoard.items });
        
        // 현재 보드가 업데이트된 보드인 경우 현재 보드도 업데이트
        if (currentBoard?.id === boardId) {
          setCurrentBoard(updatedBoard);
          
          // 선택된 아이템이 업데이트된 아이템인 경우 선택된 아이템도 업데이트
          if (selectedItem?.id === itemId) {
            const updatedItem = updatedBoard.items.find(item => item.id === itemId);
            if (updatedItem) {
              setSelectedItem(updatedItem);
            }
          }
        }
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, updateBoardInStore, setCurrentBoard, currentBoard, selectedItem, setSelectedItem, setError]
  );

  /**
   * 보드에서 아이템 삭제
   */
  const removeItem = useCallback(
    async (boardId: string, itemId: string): Promise<void> => {
      clearError();
      setLoading(true);
      
      try {
        await deleteBoardItem(boardId, itemId);
        
        // 보드 정보 다시 가져오기
        const updatedBoard = await getBoardById(boardId);
        updateBoardInStore(boardId, { items: updatedBoard.items });
        
        // 현재 보드가 업데이트된 보드인 경우 현재 보드도 업데이트
        if (currentBoard?.id === boardId) {
          setCurrentBoard(updatedBoard);
          
          // 선택된 아이템이 삭제된 아이템인 경우 선택된 아이템 초기화
          if (selectedItem?.id === itemId) {
            setSelectedItem(null);
          }
        }
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, updateBoardInStore, setCurrentBoard, currentBoard, selectedItem, setSelectedItem, setError]
  );

  /**
   * 이미지 업로드 및 아이템 추가
   */
  const uploadImageAndAddItem = useCallback(
    async (
      boardId: string,
      userId: string,
      file: File,
      position: { x: number; y: number; z: number },
      metadata: { width: number; height: number; alt?: string }
    ): Promise<string> => {
      clearError();
      setLoading(true);
      
      try {
        const itemId = await uploadImageAndAddToBoard(boardId, userId, file, position, metadata);
        
        // 보드 정보 다시 가져오기
        const updatedBoard = await getBoardById(boardId);
        updateBoardInStore(boardId, { items: updatedBoard.items });
        
        // 현재 보드가 업데이트된 보드인 경우 현재 보드도 업데이트
        if (currentBoard?.id === boardId) {
          setCurrentBoard(updatedBoard);
        }
        
        return itemId;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, updateBoardInStore, setCurrentBoard, currentBoard, setError]
  );

  return {
    boards,
    currentBoard,
    selectedItem,
    isLoading,
    error,
    fetchUserBoards,
    fetchBoardById,
    createNewBoard,
    updateBoardInfo,
    removeBoard,
    addItem,
    updateItem,
    removeItem,
    uploadImageAndAddItem,
    setSelectedItem,
    clearError,
  };
};

export default useBoard; 