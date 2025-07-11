import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  Timestamp,
  runTransaction,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Post, QueryOptions, FirestoreError, FirestoreErrorCode } from '../types/schema';

// 컬렉션 참조 상수
const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';
const BOOKMARKS_COLLECTION = 'bookmarks';

// 최대 재시도 횟수
const MAX_RETRY_COUNT = 3;

/**
 * 재시도 로직이 포함된 비동기 함수 실행 헬퍼
 * @param fn 실행할 비동기 함수
 * @param retries 남은 재시도 횟수
 * @param delay 재시도 간 지연 시간 (ms)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRY_COUNT,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) {
      throw error;
    }

    // 일시적인 오류인 경우에만 재시도
    if (
      error.code === 'unavailable' ||
      error.code === 'resource-exhausted' ||
      error.code === 'deadline-exceeded'
    ) {
      console.log(`재시도 중... 남은 횟수: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2); // 지수 백오프
    }

    throw error;
  }
}

/**
 * 게시물 목록 조회
 * @param options 쿼리 옵션
 * @returns 게시물 목록
 */
export const getPosts = async (options: QueryOptions = {}): Promise<Post[]> => {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    
    // 쿼리 빌더
    let q = query(postsRef);
    
    // 정렬 옵션 적용
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    } else {
      // 기본 정렬: 생성일 기준 내림차순
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    // 페이지네이션 시작점 적용
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }
    
    // 조회 수 제한 적용
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    // 쿼리 실행
    return withRetry(async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as Post));
    });
  } catch (error: any) {
    console.error('게시물 목록 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '게시물 목록을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 카테고리별 게시물 목록 조회
 * @param category 카테고리
 * @param options 쿼리 옵션
 * @returns 게시물 목록
 */
export const getPostsByCategory = async (
  category: string,
  options: QueryOptions = {}
): Promise<Post[]> => {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    
    // 쿼리 빌더
    let q = query(postsRef, where('category', '==', category));
    
    // 정렬 옵션 적용
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    } else {
      // 기본 정렬: 생성일 기준 내림차순
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    // 페이지네이션 시작점 적용
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }
    
    // 조회 수 제한 적용
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    // 쿼리 실행
    return withRetry(async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as Post));
    });
  } catch (error: any) {
    console.error('카테고리별 게시물 목록 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '카테고리별 게시물 목록을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 태그별 게시물 목록 조회
 * @param tag 태그
 * @param options 쿼리 옵션
 * @returns 게시물 목록
 */
export const getPostsByTag = async (
  tag: string,
  options: QueryOptions = {}
): Promise<Post[]> => {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    
    // 쿼리 빌더
    let q = query(postsRef, where('tags', 'array-contains', tag));
    
    // 정렬 옵션 적용
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    } else {
      // 기본 정렬: 생성일 기준 내림차순
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    // 페이지네이션 시작점 적용
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }
    
    // 조회 수 제한 적용
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    // 쿼리 실행
    return withRetry(async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as Post));
    });
  } catch (error: any) {
    console.error('태그별 게시물 목록 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '태그별 게시물 목록을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 사용자별 게시물 목록 조회
 * @param userId 사용자 ID
 * @param options 쿼리 옵션
 * @returns 게시물 목록
 */
export const getPostsByUser = async (
  userId: string,
  options: QueryOptions = {}
): Promise<Post[]> => {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    
    // 쿼리 빌더
    let q = query(postsRef, where('authorId', '==', userId));
    
    // 정렬 옵션 적용
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    } else {
      // 기본 정렬: 생성일 기준 내림차순
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    // 페이지네이션 시작점 적용
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }
    
    // 조회 수 제한 적용
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    // 쿼리 실행
    return withRetry(async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as Post));
    });
  } catch (error: any) {
    console.error('사용자별 게시물 목록 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '사용자별 게시물 목록을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 게시물 상세 조회
 * @param postId 게시물 ID
 * @param incrementView 조회수 증가 여부
 * @returns 게시물 상세 정보
 */
export const getPostById = async (
  postId: string,
  incrementView = true
): Promise<Post> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    
    return withRetry(async () => {
      // 트랜잭션으로 조회수 증가와 함께 게시물 정보 반환
      if (incrementView) {
        return await runTransaction(db, async (transaction) => {
          const postDoc = await transaction.get(postRef);
          
          if (!postDoc.exists()) {
            throw new FirestoreError(
              FirestoreErrorCode.NOT_FOUND,
              '게시물을 찾을 수 없습니다.'
            );
          }
          
          // 조회수 증가
          transaction.update(postRef, {
            viewCount: increment(1)
          });
          
          // 게시물 정보 반환
          return {
            ...postDoc.data(),
            id: postDoc.id,
          } as Post;
        });
      } else {
        // 조회수 증가 없이 게시물 정보만 반환
        const postDoc = await getDoc(postRef);
        
        if (!postDoc.exists()) {
          throw new FirestoreError(
            FirestoreErrorCode.NOT_FOUND,
            '게시물을 찾을 수 없습니다.'
          );
        }
        
        return {
          ...postDoc.data(),
          id: postDoc.id,
        } as Post;
      }
    });
  } catch (error: any) {
    console.error('게시물 상세 조회 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '게시물을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 게시물 생성
 * @param post 게시물 정보 (id 제외)
 * @returns 생성된 게시물 ID
 */
export const createPost = async (
  post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'commentCount' | 'viewCount'>
): Promise<string> => {
  try {
    return withRetry(async () => {
      // 기본값 설정
      const newPost = {
        ...post,
        commentCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, POSTS_COLLECTION), newPost);
      return docRef.id;
    });
  } catch (error: any) {
    console.error('게시물 생성 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '게시물을 생성하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 게시물 수정
 * @param postId 게시물 ID
 * @param updates 수정할 필드
 * @returns 성공 여부
 */
export const updatePost = async (
  postId: string,
  updates: Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'commentCount' | 'viewCount'>>
): Promise<boolean> => {
  try {
    return withRetry(async () => {
      const postRef = doc(db, POSTS_COLLECTION, postId);
      
      // 게시물 존재 여부 확인
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '게시물을 찾을 수 없습니다.'
        );
      }
      
      // 수정 시간 추가
      await updateDoc(postRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('게시물 수정 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '게시물을 수정하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 게시물 삭제 (관련 댓글 및 북마크도 함께 삭제)
 * @param postId 게시물 ID
 * @returns 성공 여부
 */
export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    return withRetry(async () => {
      // 트랜잭션으로 게시물과 관련 데이터 일괄 삭제
      await runTransaction(db, async (transaction) => {
        // 게시물 문서 참조
        const postRef = doc(db, POSTS_COLLECTION, postId);
        
        // 게시물 존재 여부 확인
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw new FirestoreError(
            FirestoreErrorCode.NOT_FOUND,
            '게시물을 찾을 수 없습니다.'
          );
        }
        
        // 관련 댓글 조회
        const commentsRef = collection(db, COMMENTS_COLLECTION);
        const commentsQuery = query(commentsRef, where('postId', '==', postId));
        const commentsSnapshot = await getDocs(commentsQuery);
        
        // 관련 북마크 조회
        const bookmarksRef = collection(db, BOOKMARKS_COLLECTION);
        const bookmarksQuery = query(bookmarksRef, where('postId', '==', postId));
        const bookmarksSnapshot = await getDocs(bookmarksQuery);
        
        // 게시물 삭제
        transaction.delete(postRef);
        
        // 관련 댓글 삭제
        commentsSnapshot.docs.forEach(doc => {
          transaction.delete(doc.ref);
        });
        
        // 관련 북마크 삭제
        bookmarksSnapshot.docs.forEach(doc => {
          transaction.delete(doc.ref);
        });
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('게시물 삭제 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '게시물을 삭제하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 게시물 검색
 * @param query 검색어
 * @param options 쿼리 옵션
 * @returns 게시물 목록
 */
export const searchPosts = async (
  searchQuery: string,
  options: QueryOptions = {}
): Promise<Post[]> => {
  try {
    // 검색어를 소문자로 변환
    const normalizedQuery = searchQuery.toLowerCase();
    
    // 모든 게시물 가져오기 (클라이언트 사이드 필터링)
    // 참고: Firestore는 전문 검색을 지원하지 않으므로 클라이언트에서 필터링
    const allPosts = await getPosts();
    
    // 제목, 내용, 태그에서 검색어 포함 여부 확인
    const filteredPosts = allPosts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(normalizedQuery);
      const contentMatch = post.content.toLowerCase().includes(normalizedQuery);
      const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
      
      return titleMatch || contentMatch || tagMatch;
    });
    
    // 정렬 및 페이지네이션 적용
    let result = [...filteredPosts];
    
    // 정렬
    if (options.orderBy) {
      result.sort((a, b) => {
        const field = options.orderBy!.field;
        const direction = options.orderBy!.direction;
        
        // 중첩 필드 처리
        const getNestedValue = (obj: any, path: string) => {
          return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
        };
        
        const aValue = getNestedValue(a, field);
        const bValue = getNestedValue(b, field);
        
        // 타임스탬프 비교
        if (aValue instanceof Timestamp && bValue instanceof Timestamp) {
          return direction === 'asc' 
            ? aValue.toMillis() - bValue.toMillis()
            : bValue.toMillis() - aValue.toMillis();
        }
        
        // 문자열 비교
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        // 숫자 비교
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }
    
    // 페이지네이션
    if (options.startAfter) {
      const startAfterIndex = result.findIndex(post => post.id === options.startAfter);
      if (startAfterIndex !== -1) {
        result = result.slice(startAfterIndex + 1);
      }
    }
    
    // 조회 수 제한
    if (options.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  } catch (error: any) {
    console.error('게시물 검색 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '게시물을 검색하는 중 오류가 발생했습니다.'
    );
  }
}; 