/**
 * 레이아웃 유틸리티 함수
 * 게시물 시각화를 위한 레이아웃 계산 알고리즘 제공
 */
import { Post } from '../services/postService';
import { Position } from '../types/schema';
import { NodePositionMap } from '../store/layoutStore';
import { colorUtils } from './colorUtils';

/**
 * 카테고리별 색상 매핑
 */
const CATEGORY_COLORS: Record<string, string> = {
  general: '#4285F4',  // 파랑
  tech: '#EA4335',     // 빨강
  design: '#FBBC05',   // 노랑
  idea: '#34A853',     // 초록
  question: '#9C27B0', // 보라
  default: '#757575'   // 회색
};

/**
 * 게시물 ID 목록에 대한 그리드 레이아웃 위치 계산
 * @param posts 게시물 목록
 * @returns 게시물 ID별 위치 맵
 */
export const calculateGridLayout = (posts: Post[]): NodePositionMap => {
  const positions: NodePositionMap = {};
  
  // 그리드 크기 계산 (정사각형에 가깝게)
  const gridSize = Math.ceil(Math.sqrt(posts.length));
  
  posts.forEach((post, index) => {
    // 그리드 내 위치 계산
    const x = (index % gridSize) / gridSize;
    const y = Math.floor(index / gridSize) / gridSize;
    
    // 2D 그리드이므로 z는 0.5로 고정
    positions[post.id] = [x, y, 0.5];
  });
  
  console.log(`그리드 레이아웃 계산 완료: ${posts.length}개 게시물, ${gridSize}x${gridSize} 그리드`);
  return positions;
};

/**
 * 게시물 ID 목록에 대한 구체 레이아웃 위치 계산 (피보나치 구체 알고리즘)
 * @param posts 게시물 목록
 * @returns 게시물 ID별 위치 맵
 */
export const calculateSphereLayout = (posts: Post[]): NodePositionMap => {
  const positions: NodePositionMap = {};
  
  // 황금비율 (피보나치 구체 알고리즘에 사용)
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  
  posts.forEach((post, index) => {
    const i = index + 1;
    const count = posts.length;
    
    // 피보나치 구체 알고리즘으로 균등 분포 계산
    const phi = Math.acos(1 - 2 * i / count);
    const theta = 2 * Math.PI * i / goldenRatio;
    
    // 구체 표면에 위치 계산 (반지름 0.4, 중심점 0.5)
    const x = 0.5 + 0.4 * Math.sin(phi) * Math.cos(theta);
    const y = 0.5 + 0.4 * Math.sin(phi) * Math.sin(theta);
    const z = 0.5 + 0.4 * Math.cos(phi);
    
    positions[post.id] = [x, y, z];
  });
  
  console.log(`구체 레이아웃 계산 완료: ${posts.length}개 게시물`);
  return positions;
};

/**
 * 게시물 카테고리에 따른 색상 반환
 * @param category 게시물 카테고리
 * @returns 색상 코드 (HEX)
 */
export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
};

/**
 * 게시물 조회수에 따른 크기 계산
 * @param viewCount 조회수
 * @returns 노드 크기 (1.0 기준)
 */
export const calculateNodeSize = (viewCount: number): number => {
  // 기본 크기 1.0, 조회수에 따라 최대 1.5배까지 증가
  const baseSize = 1.0;
  const maxSizeMultiplier = 1.5;
  
  // 로그 스케일로 크기 계산 (조회수 0은 기본 크기, 1000 이상은 최대 크기)
  if (viewCount <= 0) return baseSize;
  
  const logScale = Math.log10(viewCount) / Math.log10(1000);
  const sizeMultiplier = 1 + (Math.min(1, logScale) * (maxSizeMultiplier - 1));
  
  return baseSize * sizeMultiplier;
};

/**
 * 게시물에서 표시할 설명 텍스트 생성
 * @param post 게시물
 * @returns 설명 텍스트
 */
export const generateNodeDescription = (post: Post): string => {
  // 제목과 내용 일부를 조합하여 설명 생성
  const title = post.title;
  
  // HTML 태그 제거 및 내용 일부 추출
  const contentText = post.content
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .trim();
  
  // 내용이 너무 길면 잘라내기 (최대 50자)
  const truncatedContent = contentText.length > 50
    ? contentText.substring(0, 50) + '...'
    : contentText;
  
  return `${title}. ${truncatedContent}`;
};

/**
 * 게시물 목록을 시각화용 데이터로 변환
 * @param posts 게시물 목록
 * @param layout 레이아웃 타입 ('grid' 또는 'sphere')
 * @returns 시각화용 게시물 데이터
 */
export const preparePostsForVisualization = (
  posts: Post[],
  layout: 'grid' | 'sphere'
): NodePositionMap => {
  // 레이아웃 타입에 따라 위치 계산
  return layout === 'grid'
    ? calculateGridLayout(posts)
    : calculateSphereLayout(posts);
}; 