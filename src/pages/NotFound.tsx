import { useNavigate } from 'react-router-dom';

/**
 * 404 페이지
 * 존재하지 않는 페이지에 접근했을 때 표시됩니다.
 */
const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-8xl font-bold text-accent-primary mb-6">404</h1>
      <h2 className="text-3xl font-semibold text-text-primary mb-6">페이지를 찾을 수 없습니다</h2>
      <p className="text-xl text-text-secondary max-w-lg mb-8">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
        >
          이전 페이지로 돌아가기
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          홈으로 이동
        </button>
      </div>
    </div>
  );
};

export default NotFound; 