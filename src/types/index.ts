/**
 * 사용자 정보 타입
 */
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt: Date;
  lastLogin: Date;
}

/**
 * 보드 아이템 타입 (기본)
 */
export interface BoardItem {
  id: string;
  userId: string;
  type: 'text' | 'image' | 'link' | 'embed';
  content: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * 텍스트 아이템 타입
 */
export interface TextItem extends BoardItem {
  type: 'text';
  metadata: {
    fontSize: number;
    fontColor: string;
    backgroundColor?: string;
  };
}

/**
 * 이미지 아이템 타입
 */
export interface ImageItem extends BoardItem {
  type: 'image';
  metadata: {
    width: number;
    height: number;
    alt?: string;
  };
}

/**
 * 링크 아이템 타입
 */
export interface LinkItem extends BoardItem {
  type: 'link';
  metadata: {
    title: string;
    description?: string;
    thumbnailUrl?: string;
    url: string;
  };
}

/**
 * 임베드 아이템 타입
 */
export interface EmbedItem extends BoardItem {
  type: 'embed';
  metadata: {
    embedType: 'youtube' | 'vimeo' | 'other';
    width: number;
    height: number;
    embedCode: string;
  };
}

/**
 * 보드 타입
 */
export interface Board {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  items: BoardItem[];
  createdAt: Date;
  updatedAt: Date;
  collaborators?: string[]; // 협업자 사용자 ID 배열
  thumbnail?: string;
  tags?: string[];
}

/**
 * 시각화 설정 타입
 */
export interface VisualizationSettings {
  mode: 'grid' | 'sphere' | 'cluster';
  backgroundColor: string;
  itemSpacing: number;
  autoRotate: boolean;
  showLabels: boolean;
} 