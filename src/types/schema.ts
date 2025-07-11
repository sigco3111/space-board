import { Timestamp } from 'firebase/firestore';

/**
 * 게시물 타입 정의
 */
export interface Post {
  id: string;             // 게시물 고유 ID
  title: string;          // 게시물 제목
  content: string;        // 게시물 내용 (HTML 형식 지원)
  category: string;       // 게시물 카테고리 ('general', 'tech' 등)
  author: {               // 작성자 정보
    name: string;         // 작성자 이름
    avatarUrl: string;    // 작성자 프로필 이미지 URL
  };
  authorId: string;       // 작성자 고유 ID (사용자 인증 시스템과 연동)
  tags: string[];         // 게시물 태그 목록
  createdAt: Timestamp;   // 생성 시간 (Firebase Timestamp)
  updatedAt: Timestamp;   // 수정 시간 (Firebase Timestamp)
  commentCount: number;   // 댓글 수
  viewCount: number;      // 조회수
}

/**
 * 북마크 타입 정의
 */
export interface Bookmark {
  id?: string;            // 북마크 고유 ID (선택적)
  userId: string;         // 사용자 ID
  postId: string;         // 게시물 ID
  createdAt: Timestamp;   // 북마크 생성 시간
}

/**
 * 설정 타입 정의
 */
export interface Settings {
  id: string;             // 설정 ID (예: 'global-settings')
  categories: {           // 게시판 카테고리 목록
    id: string;           // 카테고리 ID
    name: string;         // 카테고리 이름
  }[];
  allowAnonymousPosting: boolean;  // 익명 게시물 작성 허용 여부
  allowComments: boolean;          // 댓글 허용 여부
  createdAt: Timestamp;            // 생성 시간
  updatedAt: Timestamp;            // 수정 시간
}

/**
 * 댓글 타입 정의
 */
export interface Comment {
  id: string;             // 댓글 ID
  postId: string;         // 게시물 ID
  content: string;        // 댓글 내용
  author: {               // 작성자 정보
    name: string;         // 작성자 이름
    avatarUrl: string;    // 작성자 프로필 이미지
  };
  authorId: string;       // 작성자 ID
  createdAt: Timestamp;   // 생성 시간
  updatedAt: Timestamp;   // 수정 시간
}

/**
 * 사용자 확장 정보 타입 정의
 * (Firebase Auth의 기본 정보 외에 추가로 저장할 정보)
 */
export interface UserProfile {
  uid: string;            // 사용자 고유 ID (Firebase Auth와 연동)
  displayName: string;    // 표시 이름
  email: string;          // 이메일 주소
  photoURL: string;       // 프로필 이미지 URL
  isAnonymous: boolean;   // 익명 사용자 여부
  createdAt: Timestamp;   // 계정 생성 시간
  lastLogin: Timestamp;   // 마지막 로그인 시간
}

/**
 * 쿼리 옵션 타입 정의
 */
export interface QueryOptions {
  limit?: number;         // 조회할 문서 수 제한
  orderBy?: {             // 정렬 기준
    field: string;        // 정렬 필드
    direction: 'asc' | 'desc';  // 정렬 방향
  };
  startAfter?: any;       // 페이지네이션 시작점
}

/**
 * 에러 코드 열거형
 */
export enum FirestoreErrorCode {
  NOT_FOUND = 'not-found',
  ALREADY_EXISTS = 'already-exists',
  PERMISSION_DENIED = 'permission-denied',
  UNAUTHENTICATED = 'unauthenticated',
  UNAVAILABLE = 'unavailable',
  INTERNAL = 'internal',
  UNKNOWN = 'unknown'
}

/**
 * 커스텀 Firestore 에러 클래스
 */
export class FirestoreError extends Error {
  code: FirestoreErrorCode;
  
  constructor(code: FirestoreErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'FirestoreError';
  }
} 