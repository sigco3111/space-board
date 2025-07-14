/**
 * 스키마 타입 정의
 * 애플리케이션에서 사용되는 데이터 모델 타입 정의
 */

/**
 * 위치 정보 타입 (x, y, z 좌표)
 */
export type Position = [number, number, number];

/**
 * 게시물 타입 확장 - 시각화 필드 추가
 */
export interface PostWithVisualization {
  // 기본 게시물 필드
  id: string;
  title: string;
  content: string;
  category: string;
  author: {
    name: string | null;
    avatarUrl: string | null;
  };
  authorId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
  viewCount: number;
  
  // 시각화 관련 필드
  position?: Position;           // 3D 공간에서의 위치
  highlighted?: boolean;         // 하이라이트 여부
  selected?: boolean;            // 선택 여부
  color?: string;                // 색상 (카테고리별 색상 등)
  size?: number;                 // 크기 (조회수나 댓글 수에 따라 다를 수 있음)
  description?: string;          // 시각화 시 표시할 설명 (제목 + 요약)
}

/**
 * 사용자 타입
 */
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

/**
 * 댓글 타입
 */
export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: {
    name: string | null;
    avatarUrl: string | null;
  };
  authorId: string;
  createdAt: Date;
}

/**
 * 북마크 타입
 */
export interface Bookmark {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

/**
 * 레이아웃 타입
 */
export type LayoutType = 'grid' | 'sphere'; 