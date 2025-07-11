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
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { Comment, QueryOptions, FirestoreError, FirestoreErrorCode } from '../types/schema';

// 컬렉션 참조 상수
const COMMENTS_COLLECTION = 'comments';
const POSTS_COLLECTION = 'posts';

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
 * 게시물의 댓글 목록 조회
 * @param postId 게시물 ID
 * @param options 쿼리 옵션
 * @returns 댓글 목록
 */
export const getCommentsByPostId = async (
  postId: string,
  options: QueryOptions = {}
): Promise<Comment[]> => {
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    
    // 쿼리 빌더
    let q = query(commentsRef, where('postId', '==', postId));
    
    // 정렬 옵션 적용
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    } else {
      // 기본 정렬: 생성일 기준 오름차순 (오래된 댓글부터)
      q = query(q, orderBy('createdAt', 'asc'));
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
      } as Comment));
    });
  } catch (error: any) {
    console.error('댓글 목록 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '댓글 목록을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 사용자별 댓글 목록 조회
 * @param userId 사용자 ID
 * @param options 쿼리 옵션
 * @returns 댓글 목록
 */
export const getCommentsByUserId = async (
  userId: string,
  options: QueryOptions = {}
): Promise<Comment[]> => {
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    
    // 쿼리 빌더
    let q = query(commentsRef, where('authorId', '==', userId));
    
    // 정렬 옵션 적용
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    } else {
      // 기본 정렬: 생성일 기준 내림차순 (최신 댓글부터)
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
      } as Comment));
    });
  } catch (error: any) {
    console.error('사용자별 댓글 목록 조회 중 오류 발생:', error);
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '사용자별 댓글 목록을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 댓글 상세 조회
 * @param commentId 댓글 ID
 * @returns 댓글 상세 정보
 */
export const getCommentById = async (commentId: string): Promise<Comment> => {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    
    return withRetry(async () => {
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '댓글을 찾을 수 없습니다.'
        );
      }
      
      return {
        ...commentDoc.data(),
        id: commentDoc.id,
      } as Comment;
    });
  } catch (error: any) {
    console.error('댓글 상세 조회 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '댓글을 불러오는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 댓글 생성
 * @param comment 댓글 정보 (id 제외)
 * @returns 생성된 댓글 ID
 */
export const createComment = async (
  comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    return withRetry(async () => {
      // 트랜잭션으로 댓글 생성과 게시물의 댓글 수 증가를 함께 처리
      return await runTransaction(db, async (transaction) => {
        // 게시물 존재 여부 확인
        const postRef = doc(db, POSTS_COLLECTION, comment.postId);
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists()) {
          throw new FirestoreError(
            FirestoreErrorCode.NOT_FOUND,
            '게시물을 찾을 수 없습니다.'
          );
        }
        
        // 댓글 생성
        const newComment = {
          ...comment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        const commentRef = collection(db, COMMENTS_COLLECTION);
        const docRef = await addDoc(commentRef, newComment);
        
        // 게시물의 댓글 수 증가
        transaction.update(postRef, {
          commentCount: increment(1)
        });
        
        return docRef.id;
      });
    });
  } catch (error: any) {
    console.error('댓글 생성 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '댓글을 생성하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 댓글 수정
 * @param commentId 댓글 ID
 * @param updates 수정할 필드
 * @returns 성공 여부
 */
export const updateComment = async (
  commentId: string,
  updates: Pick<Comment, 'content'>
): Promise<boolean> => {
  try {
    return withRetry(async () => {
      const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
      
      // 댓글 존재 여부 확인
      const commentDoc = await getDoc(commentRef);
      if (!commentDoc.exists()) {
        throw new FirestoreError(
          FirestoreErrorCode.NOT_FOUND,
          '댓글을 찾을 수 없습니다.'
        );
      }
      
      // 수정 시간 추가
      await updateDoc(commentRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('댓글 수정 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '댓글을 수정하는 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 댓글 삭제
 * @param commentId 댓글 ID
 * @returns 성공 여부
 */
export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    return withRetry(async () => {
      // 트랜잭션으로 댓글 삭제와 게시물의 댓글 수 감소를 함께 처리
      await runTransaction(db, async (transaction) => {
        // 댓글 문서 참조
        const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
        
        // 댓글 존재 여부 확인 및 게시물 ID 가져오기
        const commentDoc = await transaction.get(commentRef);
        if (!commentDoc.exists()) {
          throw new FirestoreError(
            FirestoreErrorCode.NOT_FOUND,
            '댓글을 찾을 수 없습니다.'
          );
        }
        
        const postId = commentDoc.data().postId;
        
        // 게시물 문서 참조
        const postRef = doc(db, POSTS_COLLECTION, postId);
        
        // 게시물 존재 여부 확인
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          // 게시물이 이미 삭제된 경우, 댓글만 삭제
          transaction.delete(commentRef);
          return;
        }
        
        // 댓글 삭제
        transaction.delete(commentRef);
        
        // 게시물의 댓글 수 감소
        // 댓글 수가 0 미만이 되지 않도록 보장
        const currentCommentCount = postDoc.data().commentCount || 0;
        transaction.update(postRef, {
          commentCount: Math.max(0, currentCommentCount - 1)
        });
      });
      
      return true;
    });
  } catch (error: any) {
    console.error('댓글 삭제 중 오류 발생:', error);
    
    if (error instanceof FirestoreError) {
      throw error;
    }
    
    throw new FirestoreError(
      FirestoreErrorCode.UNKNOWN,
      '댓글을 삭제하는 중 오류가 발생했습니다.'
    );
  }
}; 