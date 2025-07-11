import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useBoard from '../hooks/useBoard';
import type { Board } from '../types';

/**
 * 대시보드 페이지
 * 사용자의 보드 목록과 최근 활동을 표시합니다.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const { boards, fetchUserBoards, createNewBoard, isLoading } = useBoard();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 사용자의 보드 목록 가져오기
  useEffect(() => {
    if (user) {
      fetchUserBoards(user.id);
    }
  }, [user, fetchUserBoards]);
  
  /**
   * 새 보드 생성 처리
   */
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBoardTitle.trim()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (user) {
        await createNewBoard(
          user.id,
          newBoardTitle.trim(),
          newBoardDescription.trim(),
          false // isPublic
        );
        
        // 모달 닫기 및 입력 초기화
        setShowCreateModal(false);
        setNewBoardTitle('');
        setNewBoardDescription('');
      }
    } catch (error) {
      console.error('보드 생성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * 보드 카드 컴포넌트
   */
  const BoardCard = ({ board }: { board: Board }) => (
    <Link 
      to={`/board/${board.id}`} 
      className="block bg-background-secondary border border-border rounded-lg overflow-hidden hover:border-accent-primary transition-colors"
    >
      <div className="p-6">
        <h3 className="text-xl font-semibold text-text-primary mb-2">{board.title}</h3>
        {board.description && (
          <p className="text-text-secondary mb-4 line-clamp-2">{board.description}</p>
        )}
        <div className="flex justify-between items-center text-sm text-text-tertiary">
          <span>
            {new Date(board.updatedAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
              />
            </svg>
            {board.tags?.includes('grid') ? '그리드형' : '구체형'}
          </span>
        </div>
      </div>
    </Link>
  );
  
  // 보드 생성 모달
  const CreateBoardModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background-secondary border border-border rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">새 보드 만들기</h2>
          <button 
            onClick={() => setShowCreateModal(false)}
            className="text-text-tertiary hover:text-text-primary"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleCreateBoard} className="p-6">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">
              제목
            </label>
            <input
              id="title"
              type="text"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              className="input w-full"
              placeholder="보드 제목"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
              설명 (선택사항)
            </label>
            <textarea
              id="description"
              value={newBoardDescription}
              onChange={(e) => setNewBoardDescription(e.target.value)}
              className="input w-full h-24 resize-none"
              placeholder="보드에 대한 설명을 입력하세요"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !newBoardTitle.trim()}
            >
              {isSubmitting ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary">내 보드</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
          새 보드 만들기
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-t-4 border-accent-primary rounded-full animate-spin"></div>
        </div>
      ) : boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      ) : (
        <div className="bg-background-secondary border border-border rounded-lg p-8 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-text-tertiary mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
            />
          </svg>
          <h2 className="text-xl font-semibold text-text-primary mb-2">보드가 없습니다</h2>
          <p className="text-text-secondary mb-6">
            첫 번째 보드를 만들어 아이디어를 시각화해보세요
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            새 보드 만들기
          </button>
        </div>
      )}
      
      {showCreateModal && <CreateBoardModal />}
    </div>
  );
};

export default Dashboard; 