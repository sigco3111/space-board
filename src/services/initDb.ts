import { Timestamp } from 'firebase/firestore';
import { initializeGlobalSettings } from './settingsService';
import { createPost } from './postService';
import { createOrUpdateUserProfile } from './userService';

/**
 * 데이터베이스 초기화 함수
 * 애플리케이션 최초 실행 시 기본 데이터를 생성합니다.
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('데이터베이스 초기화 시작...');
    
    // 전역 설정 초기화
    const settings = await initializeGlobalSettings();
    console.log('전역 설정 초기화 완료:', settings);
    
    // 관리자 계정 생성 (실제 환경에서는 보안을 위해 별도로 처리해야 함)
    const adminUser = {
      uid: 'admin',
      displayName: '관리자',
      email: 'admin@example.com',
      photoURL: 'https://via.placeholder.com/150',
      isAnonymous: false,
    };
    
    await createOrUpdateUserProfile(adminUser);
    console.log('관리자 계정 생성 완료');
    
    // 환영 게시물 생성
    const welcomePost = {
      title: 'SPACE-BOARD에 오신 것을 환영합니다!',
      content: `
        <h2>3D 공간에서 만나는 새로운 게시판 경험</h2>
        <p>SPACE-BOARD는 게시물을 3D 공간에 시각화하는 혁신적인 게시판 시스템입니다.</p>
        <p>다양한 카테고리와 태그를 통해 게시물을 구조화하고, 구체형과 그리드형 레이아웃으로 시각화합니다.</p>
        <p>지금 바로 새로운 게시물을 작성하고 3D 공간에서 탐색해보세요!</p>
      `,
      category: 'general',
      author: {
        name: '관리자',
        avatarUrl: 'https://via.placeholder.com/150',
      },
      authorId: 'admin',
      tags: ['환영', '소개', '시작하기'],
    };
    
    await createPost(welcomePost);
    console.log('환영 게시물 생성 완료');
    
    // 기술 게시판 이용 안내 게시물
    const techGuidePost = {
      title: '기술 게시판 이용 안내',
      content: `
        <h2>기술 게시판 이용 가이드</h2>
        <p>기술 게시판은 개발, 프로그래밍, 디자인 등 기술 관련 주제를 다루는 공간입니다.</p>
        <p>다음 가이드라인을 참고하여 게시물을 작성해주세요:</p>
        <ul>
          <li>명확한 제목과 태그를 사용하여 게시물의 주제를 표현해주세요.</li>
          <li>코드 블록은 적절한 마크다운 형식으로 작성해주세요.</li>
          <li>가능한 한 자세한 설명과 예시를 포함해주세요.</li>
          <li>다른 사용자의 질문에 적극적으로 답변해주세요.</li>
        </ul>
      `,
      category: 'tech',
      author: {
        name: '관리자',
        avatarUrl: 'https://via.placeholder.com/150',
      },
      authorId: 'admin',
      tags: ['가이드', '기술', '이용안내'],
    };
    
    await createPost(techGuidePost);
    console.log('기술 게시판 이용 안내 게시물 생성 완료');
    
    console.log('데이터베이스 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류 발생:', error);
    throw error;
  }
}; 