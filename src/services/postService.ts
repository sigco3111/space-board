/**
 * 게시물 관련 기능을 처리하는 서비스
 * 게시물 목록 조회, 상세 조회, 생성, 수정, 삭제 기능 제공
 */
import { 
  collection, 
  query, 
  getDocs, 
  getDoc,
  doc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  orderBy,
  where,
  Timestamp,
  limit,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  QueryConstraint,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { UserData } from './auth';

// 컬렉션 이름 상수
const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';

// 게시물 인터페이스 정의
export interface Post {
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
}

// Firestore에 저장할 게시물 데이터 인터페이스
interface PostData {
  title: string;
  content: string;
  category: string;
  author: {
    name: string | null;
    avatarUrl: string | null;
  };
  authorId: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  commentCount: number;
  viewCount: number;
}

// 더미 게시물 데이터
export const DUMMY_POSTS: Post[] = [
  {
    id: 'dummy-1',
    title: '샘플 게시물 1',
    content: '<p>이것은 더미 데이터입니다. Firebase 연결이 없을 때 표시됩니다.</p>',
    category: 'general',
    author: {
      name: '테스트 사용자',
      avatarUrl: null
    },
    authorId: 'test-user',
    tags: ['샘플', '더미'],
    createdAt: new Date(),
    updatedAt: new Date(),
    commentCount: 0,
    viewCount: 5
  },
  {
    id: 'dummy-2',
    title: '샘플 게시물 2',
    content: '<p>Firebase 설정이 필요합니다. .env 파일에 올바른 Firebase 설정을 추가해주세요.</p>',
    category: 'tech',
    author: {
      name: '시스템',
      avatarUrl: null
    },
    authorId: 'system',
    tags: ['안내', '설정'],
    createdAt: new Date(),
    updatedAt: new Date(),
    commentCount: 0,
    viewCount: 3
  }
];

// 재시도 관련 설정
const MAX_RETRY_COUNT = 3;

/**
 * 지수 백오프 지연 함수
 * 재시도 사이에 점점 늘어나는 지연 시간을 적용합니다.
 */
const delay = (attempts: number) => {
  return new Promise(resolve => {
    // 1초, 2초, 4초 등으로 지연 시간 증가
    const waitTime = Math.pow(2, attempts - 1) * 1000;
    setTimeout(resolve, waitTime);
  });
};

/**
 * Firestore 문서를 Post 인터페이스로 변환하는 함수
 */
const mapDocToPost = (doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot): Post => {
  const data = doc.data() as PostData;
  
  return {
    id: doc.id,
    title: data.title || '제목 없음',
    content: data.content || '',
    category: data.category || 'general',
    author: data.author || { name: '알 수 없음', avatarUrl: null },
    authorId: data.authorId || '',
    tags: data.tags || [],
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    commentCount: data.commentCount || 0,
    viewCount: data.viewCount || 0
  };
};

/**
 * 모든 게시물 목록을 최신순으로 조회하는 함수
 * @param limitCount 조회할 게시물 수 제한 (기본값: 20)
 */
export const getAllPosts = async (limitCount = 20): Promise<Post[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      console.log(`게시물 목록 조회 시도 중... (시도 ${attempts}/${MAX_RETRY_COUNT})`);
      
      // 게시물 컬렉션에서 생성일 기준 내림차순으로 정렬하여 조회
      const postsQuery = query(
        collection(db, POSTS_COLLECTION), 
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(postsQuery);
      const posts: Post[] = [];
      
      // 각 문서를 Post 인터페이스로 변환하여 배열에 추가
      querySnapshot.forEach((doc) => {
        try {
          posts.push(mapDocToPost(doc));
        } catch (e) {
          console.error("게시물 변환 중 오류:", e);
        }
      });
      
      console.log(`게시물 ${posts.length}개 조회 완료`);
      
      // 조회된 게시물이 없으면 더미 데이터 반환
      if (posts.length === 0) {
        console.log("조회된 게시물이 없어 더미 데이터 사용");
        return DUMMY_POSTS;
      }
      
      return posts;
    } catch (error) {
      console.error(`게시물 목록 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      if (attempts >= MAX_RETRY_COUNT) {
        console.warn("최대 재시도 횟수 초과, 더미 데이터 반환");
        return DUMMY_POSTS;
      }
      
      // 지수 백오프 적용
      await delay(attempts);
    }
  }
  
  // 모든 시도 실패 시 더미 데이터 반환
  return DUMMY_POSTS;
};

/**
 * 특정 카테고리의 게시물 목록을 조회하는 함수
 * @param category 조회할 카테고리
 * @param limitCount 조회할 게시물 수 제한 (기본값: 20)
 */
export const getPostsByCategory = async (category: string, limitCount = 20): Promise<Post[]> => {
  // 카테고리가 유효하지 않은 경우 모든 게시물 반환
  if (!category || category === 'all') {
    return getAllPosts(limitCount);
  }
  
  let attempts = 0;
  const dummyFallback = DUMMY_POSTS.filter(post => post.category === category);
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      console.log(`카테고리 ${category} 게시물 목록 조회 시도 중... (시도 ${attempts}/${MAX_RETRY_COUNT})`);
      
      // 쿼리 제약 조건 생성
      const constraints: QueryConstraint[] = [
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      ];
      
      // 특정 카테고리에 속한 게시물을 생성일 기준 내림차순으로 정렬하여 조회
      const postsQuery = query(
        collection(db, POSTS_COLLECTION),
        ...constraints
      );
      
      const querySnapshot = await getDocs(postsQuery);
      const posts: Post[] = [];
      
      // 각 문서를 Post 인터페이스로 변환하여 배열에 추가
      querySnapshot.forEach((doc) => {
        try {
          posts.push(mapDocToPost(doc));
        } catch (e) {
          console.error("게시물 변환 중 오류:", e);
        }
      });
      
      console.log(`카테고리 ${category} 게시물 ${posts.length}개 조회 완료`);
      
      // 조회된 게시물이 없으면 더미 데이터에서 필터링하여 반환
      if (posts.length === 0) {
        console.log("조회된 게시물이 없어 더미 데이터에서 필터링하여 사용");
        return dummyFallback;
      }
      
      return posts;
    } catch (error: any) {
      console.error(`${category} 카테고리 게시물 목록 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // Firebase 인덱스 오류 처리
      if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
        const indexUrl = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
        const indexMessage = indexUrl 
          ? `Firebase 복합 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성해주세요: ${indexUrl}`
          : 'Firebase 복합 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.';
        
        console.error(indexMessage);
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        console.warn("최대 재시도 횟수 초과, 더미 데이터 반환");
        return dummyFallback;
      }
      
      // 지수 백오프 적용
      await delay(attempts);
    }
  }
  
  // 모든 시도 실패 시 더미 데이터 반환
  return dummyFallback;
};

/**
 * 특정 사용자가 작성한 게시물 목록을 조회하는 함수
 * @param userId 조회할 사용자 ID
 * @param limitCount 조회할 게시물 수 제한 (기본값: 20)
 */
export const getPostsByUser = async (userId: string, limitCount = 20): Promise<Post[]> => {
  let attempts = 0;
  const dummyFallback = DUMMY_POSTS.filter(post => post.authorId === 'test-user');
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      console.log(`사용자 ${userId}의 게시물 목록 조회 시도 중... (시도 ${attempts}/${MAX_RETRY_COUNT})`);
      
      // 특정 사용자가 작성한 게시물을 생성일 기준 내림차순으로 정렬하여 조회
      const postsQuery = query(
        collection(db, POSTS_COLLECTION),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(postsQuery);
      const posts: Post[] = [];
      
      // 각 문서를 Post 인터페이스로 변환하여 배열에 추가
      querySnapshot.forEach((doc) => {
        try {
          posts.push(mapDocToPost(doc));
        } catch (e) {
          console.error("게시물 변환 중 오류:", e);
        }
      });
      
      console.log(`사용자 ${userId}의 게시물 ${posts.length}개 조회 완료`);
      return posts;
    } catch (error: any) {
      console.error(`사용자 ${userId}의 게시물 목록 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      if (attempts >= MAX_RETRY_COUNT) {
        console.warn("최대 재시도 횟수 초과, 더미 데이터 반환");
        return dummyFallback;
      }
      
      // 지수 백오프 적용
      await delay(attempts);
    }
  }
  
  // 모든 시도 실패 시 더미 데이터 반환
  return dummyFallback;
};

/**
 * 특정 게시물의 상세 정보를 조회하는 함수
 * @param postId 조회할 게시물 ID
 */
export const getPostById = async (postId: string): Promise<Post> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      console.log(`게시물 ${postId} 조회 시도 중... (시도 ${attempts}/${MAX_RETRY_COUNT})`);
      
      // 특정 ID의 게시물 문서 조회
      const postDoc = await getDoc(doc(db, POSTS_COLLECTION, postId));
      
      if (!postDoc.exists()) {
        console.warn(`게시물 ${postId}를 찾을 수 없습니다.`);
        throw new Error('게시물을 찾을 수 없습니다.');
      }
      
      console.log(`게시물 ${postId} 조회 완료`);
      return mapDocToPost(postDoc);
    } catch (error) {
      console.error(`게시물 ${postId} 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      if (attempts >= MAX_RETRY_COUNT) {
        // 더미 데이터에서 ID로 찾아보고, 없으면 첫 번째 더미 게시물 반환
        const dummyPost = DUMMY_POSTS.find(post => post.id === postId);
        if (dummyPost) return dummyPost;
        
        return DUMMY_POSTS[0]; // 없으면 첫 번째 더미 게시물 반환
      }
      
      // 지수 백오프 적용
      await delay(attempts);
    }
  }
  
  // 모든 시도 실패 시 첫 번째 더미 게시물 반환
  return DUMMY_POSTS[0];
};

/**
 * 새로운 게시물을 생성하는 함수
 * @param postData 생성할 게시물 정보
 * @param user 현재 로그인한 사용자 정보
 */
export const createPost = async (
  postData: { 
    title: string; 
    content: string; 
    category: string; 
    tags: string[] 
  },
  user: UserData
): Promise<Post> => {
  try {
    // 현재 시간
    const now = Timestamp.now();
    
    // 저장할 게시물 데이터 생성
    const newPostData: PostData = {
      title: postData.title,
      content: postData.content,
      category: postData.category,
      author: {
        name: user.displayName,
        avatarUrl: user.photoURL
      },
      authorId: user.uid,
      tags: postData.tags || [],
      createdAt: now,
      updatedAt: now,
      commentCount: 0,
      viewCount: 0
    };
    
    // Firestore에 게시물 추가
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), newPostData);
    
    // 생성된 게시물 반환
    return {
      id: docRef.id,
      ...newPostData,
      createdAt: now.toDate(),
      updatedAt: now.toDate()
    };
  } catch (error) {
    console.error('게시물 생성 중 오류 발생:', error);
    throw new Error('게시물 생성에 실패했습니다.');
  }
}; 