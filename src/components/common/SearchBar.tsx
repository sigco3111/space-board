/**
 * 검색바 컴포넌트
 * 게시물 검색 및 필터링 기능 제공
 */
import React, { useRef, useState, useEffect } from 'react';
import { usePostStore } from '../../store';

/**
 * 검색 프리셋 목록
 */
const searchPresets = [
  '게시물 제목',
  '작성자 이름',
  '카테고리:tech',
  '태그:react'
];

/**
 * 카테고리 목록
 */
const categories = [
  { id: null, name: '전체' },
  { id: 'general', name: '일반' },
  { id: 'tech', name: '기술' },
  { id: 'design', name: '디자인' },
  { id: 'idea', name: '아이디어' },
  { id: 'question', name: '질문' }
];

/**
 * 검색바 속성 인터페이스
 */
interface SearchBarProps {
  className?: string;
}

/**
 * 검색바 컴포넌트
 */
const SearchBar: React.FC<SearchBarProps> = ({ className = '' }) => {
  // 스토어에서 필요한 상태 및 액션 가져오기
  const searchQuery = usePostStore.use.searchQuery();
  const setSearchQuery = usePostStore.use.setSearchQuery();
  const categoryFilter = usePostStore.use.categoryFilter();
  const setCategoryFilter = usePostStore.use.setCategoryFilter();
  const isLoading = usePostStore.use.isLoading();
  
  // 로컬 상태
  const [value, setValue] = useState(searchQuery);
  const [searchPresetIdx, setSearchPresetIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 프리셋 순환 타이머
  useEffect(() => {
    const interval = setInterval(() => {
      setSearchPresetIdx(prev => (prev + 1) % searchPresets.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // 검색 쿼리 변경 시 로컬 값 업데이트
  useEffect(() => {
    setValue(searchQuery);
  }, [searchQuery]);
  
  /**
   * 검색 실행 함수
   */
  const executeSearch = () => {
    if (!value.trim()) {
      setSearchQuery('');
      return;
    }
    
    // 검색어 저장 및 필터링 실행
    setSearchQuery(value.trim());
  };
  
  /**
   * 검색 입력 변경 핸들러
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  
  /**
   * 키 입력 핸들러 (Enter 키 처리)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
      inputRef.current?.blur();
    }
  };
  
  /**
   * 검색 초기화 핸들러
   */
  const handleClear = () => {
    setValue('');
    setSearchQuery('');
  };

  /**
   * 카테고리 변경 핸들러
   */
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategoryFilter(value === 'null' ? null : value);
  };

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-container">
        <div className="input-container">
          <input
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            placeholder={`검색어 입력... 예: "${searchPresets[searchPresetIdx]}"`}
            disabled={isLoading}
          />
          
          {isLoading ? (
            <div className="spinner active" />
          ) : (
            <button
              onClick={handleClear}
              className={`clear-button ${value ? 'active' : ''}`}
              aria-label="검색 초기화"
              title="검색 초기화"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="filter-container">
          <select
            value={categoryFilter === null ? 'null' : categoryFilter}
            onChange={handleCategoryChange}
            disabled={isLoading}
          >
            {categories.map(category => (
              <option 
                key={category.id === null ? 'all' : category.id} 
                value={category.id === null ? 'null' : category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={executeSearch}
            disabled={isLoading}
            className="search-button"
          >
            검색
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar; 