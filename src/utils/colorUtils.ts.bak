/**
 * 색상 유틸리티 함수
 * 게시물 시각화를 위한 색상 관련 유틸리티 제공
 */

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
 * 문자열에서 일관된 색상 생성
 * @param str 색상을 생성할 문자열 (예: 카테고리명, 태그명 등)
 * @returns HEX 색상 코드
 */
const getColorFromString = (str: string): string => {
  // 문자열을 해시값으로 변환
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 해시값을 색상으로 변환
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

/**
 * 카테고리에 따른 색상 반환
 * @param category 게시물 카테고리
 * @returns 색상 코드 (HEX)
 */
const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
};

/**
 * HEX 색상을 RGB 배열로 변환
 * @param hex HEX 색상 코드 (예: #RRGGBB)
 * @returns RGB 배열 [r, g, b] (0-255)
 */
const hexToRgb = (hex: string): [number, number, number] => {
  // #을 제거하고 RGB 값 추출
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  
  if (!result) {
    return [0, 0, 0]; // 기본값 반환
  }
  
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
};

/**
 * RGB 색상을 HEX 코드로 변환
 * @param r 빨강 (0-255)
 * @param g 초록 (0-255)
 * @param b 파랑 (0-255)
 * @returns HEX 색상 코드 (예: #RRGGBB)
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
};

/**
 * 색상의 밝기 조정
 * @param color HEX 색상 코드
 * @param factor 밝기 조정 계수 (0-2, 1보다 작으면 어둡게, 1보다 크면 밝게)
 * @returns 조정된 HEX 색상 코드
 */
const adjustBrightness = (color: string, factor: number): string => {
  const rgb = hexToRgb(color);
  const adjustedRgb = rgb.map(value => {
    // 밝기 조정 (0-255 범위 유지)
    return Math.min(255, Math.max(0, Math.round(value * factor)));
  }) as [number, number, number];
  
  return rgbToHex(...adjustedRgb);
};

/**
 * 색상 관련 유틸리티 함수 모음
 */
export const colorUtils = {
  getCategoryColor,
  getColorFromString,
  hexToRgb,
  rgbToHex,
  adjustBrightness,
  CATEGORY_COLORS
}; 