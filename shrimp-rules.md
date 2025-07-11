# SPACE-BOARD 개발 가이드라인

## 프로젝트 개요

### 목적 및 핵심 기능
- SPACE-BOARD는 Firebase를 백엔드로 활용하는 3D 시각화 게시판 애플리케이션임
- 구글 로그인 사용자는 CRUD 권한을 가지며, 익명 사용자는 읽기 전용 접근만 허용됨
- 게시물을 3D 공간에 시각화하여 직관적인 탐색 경험을 제공함

### 기술 스택
- **프론트엔드**: React, TypeScript, Three.js/React Three Fiber, Framer Motion, Tailwind CSS, Zustand
- **백엔드**: Firebase (Authentication, Firestore, Storage, Hosting)

### 주요 구성 요소
- 인증 시스템 (Google OAuth)
- 게시판 CRUD 기능
- 3D 시각화 (구체형, 그리드형 레이아웃)
- 북마크 및 태그 시스템
- 검색 및 필터링 기능

## 프로젝트 아키텍처

### 폴더 구조
- `/src`: 소스 코드
  - `/components`: 리액트 컴포넌트
    - `/auth`: 인증 관련 컴포넌트
    - `/board`: 게시판 관련 컴포넌트
    - `/visualization`: 3D 시각화 컴포넌트
    - `/common`: 공통 컴포넌트
  - `/hooks`: 커스텀 훅
  - `/services`: 서비스 (Firebase 연동 등)
  - `/store`: Zustand 스토어
  - `/types`: TypeScript 타입 정의
  - `/utils`: 유틸리티 함수
  - `/styles`: 글로벌 스타일
- `/public`: 정적 파일
- `/참고`: 참조용 코드 (직접 수정 금지)

### 주요 파일
- `src/main.tsx`: 애플리케이션 진입점
- `src/App.tsx`: 루트 컴포넌트
- `src/services/firebase.ts`: Firebase 설정 및 서비스
- `src/store/index.ts`: Zustand 스토어 설정
- `src/components/visualization/VisualizationCanvas.tsx`: 3D 시각화 컨테이너

## 코드 표준

### 명명 규칙
- **파일명**: PascalCase (컴포넌트), camelCase (일반 모듈)
- **컴포넌트**: PascalCase (`BoardList.tsx`, `PostViewer.tsx`)
- **함수**: camelCase (`fetchPosts()`, `handleSubmit()`)
- **상수**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`)
- **불리언 변수**: is, has, can 접두사 사용 (`isVisible`, `hasPermission`)

### 포맷팅 요구사항
- 들여쓰기: 2칸 공백
- 세미콜론 필수
- 작은따옴표 사용 (문자열)
- JSX 속성은 쌍따옴표 사용

### 주석 규칙
- 모든 함수나 주요 로직 상단에 한국어로 간단한 설명 추가
- 복잡한 논리 구조나 중요한 단계에는 필수적으로 주석 추가
- 주석은 한국어로 작성하고 꼭 필요한 정보만 기재

```typescript
/**
 * 게시물 데이터를 불러오고 3D 시각화에 필요한 형태로 변환하는 함수
 * @param category - 불러올 게시물의 카테고리 (선택사항)
 * @returns 시각화 가능한 형태의 게시물 배열
 */
const fetchAndTransformPosts = async (category?: string) => {
  // Firestore에서 게시물 데이터 쿼리
  // ...
  
  // 3D 시각화에 적합한 형태로 데이터 변환
  // ...
  
  return transformedPosts;
};
```

### 파일 구성 원칙
- 주요 기능별로 폴더 구분하여 파일 구성
- 한 파일에는 하나의 주요 기능만 정의
- 외부 의존성이 높은 코드는 별도 파일에 분리 (API 호출, 데이터베이스 연동 등)

## 기능 구현 표준

### Firebase 인증 구현
- `src/services/authService.ts`에서 인증 관련 기능을 모듈화하여 구현
- 구글 로그인 및 로그아웃 기능 구현
- 인증 상태 변경 감지를 위한 리스너 구현
- 인증 관련 훅은 `src/hooks/useAuth.ts`에 구현

```typescript
// authService.ts 예시
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// 구글 로그인 함수
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('구글 로그인 실패:', error);
    throw error;
  }
};
```

### Firestore CRUD 작업
- `src/services/postService.ts`에서 게시물 관련 CRUD 기능 구현
- `src/services/bookmarkService.ts`에서 북마크 관련 기능 구현
- `src/services/commentService.ts`에서 댓글 관련 기능 구현
- DATABASE-SCHEMA.md에 정의된 데이터 구조 준수

```typescript
// postService.ts 예시
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// 게시물 생성 함수
export const createPost = async (postData) => {
  try {
    const postRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return postRef.id;
  } catch (error) {
    console.error('게시물 생성 실패:', error);
    throw error;
  }
};
```

### 3D 시각화 구현
- React Three Fiber를 사용하여 3D 시각화 구현
- `src/components/visualization` 폴더에 관련 컴포넌트 구현
- 레이아웃 모드: 구체형(Sphere), 그리드형(Grid)
- 노드 클릭, 드래그, 줌 인/아웃 등 인터랙션 구현

```tsx
// VisualizationCanvas.tsx 예시
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import PostNode from './PostNode';
import useStore from '../../store';

// 3D 시각화 캔버스 컴포넌트
const VisualizationCanvas = () => {
  const { posts, layout, activePost } = useStore(state => ({
    posts: state.posts,
    layout: state.layout,
    activePost: state.activePost
  }));

  return (
    <Canvas camera={{ position: [0, 0, 300] }}>
      <ambientLight intensity={0.5} />
      <OrbitControls />
      {posts.map(post => (
        <PostNode
          key={post.id}
          post={post}
          layout={layout}
          isActive={post.id === activePost?.id}
        />
      ))}
    </Canvas>
  );
};
```

### 권한 관리
- Firebase Security Rules를 통해 데이터 접근 제어
- 익명 사용자: 읽기만 허용
- 로그인 사용자: 자신의 게시물에 대한 CRUD 권한
- 권한 확인 로직을 UI 컴포넌트와 분리하여 구현

```typescript
// 권한 확인 함수 예시
export const canEditPost = (post, currentUser) => {
  if (!currentUser) return false;
  return post.authorId === currentUser.uid;
};
```

## 외부 라이브러리 사용 표준

### React 컴포넌트 작성
- 함수형 컴포넌트 사용
- React Hooks 적극 활용 (useState, useEffect, useCallback, useMemo)
- 커스텀 훅을 통한 로직 재사용

### Three.js/React Three Fiber 활용
- `@react-three/fiber`와 `@react-three/drei` 라이브러리 활용
- 3D 객체는 컴포넌트로 모듈화하여 구현
- 성능 최적화를 위한 메모이제이션 적용

### Zustand 상태 관리
- 전역 상태는 `src/store`에서 관리
- 주요 상태: 게시물 목록, 레이아웃 설정, 활성화된 게시물, 인증 상태 등
- 상태 업데이트 함수도 스토어 내부에 구현

```typescript
// store/index.ts 예시
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useStore = create(immer((set) => ({
  posts: [],
  layout: 'sphere',
  activePost: null,
  setPosts: (posts) => set(state => { state.posts = posts }),
  setLayout: (layout) => set(state => { state.layout = layout }),
  setActivePost: (post) => set(state => { state.activePost = post })
})));
```

### Tailwind CSS 스타일링
- 컴포넌트 스타일링은 Tailwind CSS 클래스 사용
- 공통 스타일은 `src/styles` 폴더에서 관리
- 테마 색상 및 디자인은 `design-guide.md`에 정의된 값 사용

## 워크플로우 표준

### 데이터 흐름
- Firestore → 서비스 → 스토어 → 컴포넌트 흐름 준수
- 데이터 변경은 서비스 계층을 통해서만 수행
- 상태 업데이트는 Zustand 스토어를 통해 관리

### 사용자 인터랙션 처리
- 이벤트 핸들러는 가능한 한 최상위 컴포넌트에서 정의
- 드래그, 클릭 등의 3D 인터랙션은 Three.js 이벤트 시스템 활용
- 데이터 로딩 중에는 로딩 상태 표시

### 오류 처리
- 모든 함수는 예외 상황을 고려한 에러 처리 포함
- 에러 발생 시 콘솔에 로그 기록
- 사용자에게는 일반적인 에러 메시지 제공
- 특정 에러 발생 시 사용자가 다음에 취할 수 있는 조치 안내

```typescript
// 에러 처리 예시
try {
  await createPost(postData);
} catch (error) {
  console.error('게시물 생성 중 오류 발생:', error);
  
  if (error.code === 'permission-denied') {
    return '권한이 없습니다. 로그인이 필요합니다.';
  }
  
  return '게시물을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}
```

## 핵심 파일 상호작용 표준

### 컴포넌트 간 통신
- 부모-자식 컴포넌트 간 통신은 props 활용
- 관련 없는 컴포넌트 간 통신은 Zustand 스토어 활용
- 이벤트 핸들러는 콜백 함수로 전달

### Firebase 서비스와 컴포넌트 통합
- Firebase 서비스는 React 컴포넌트에서 직접 호출하지 않고 훅이나 서비스 계층을 통해 접근
- 인증 상태 변경은 전역 상태로 관리
- 데이터 로딩 상태와 에러 상태도 전역 상태로 관리

### 3D 시각화와 데이터 바인딩
- 게시물 데이터와 3D 노드 간의 매핑 로직 구현
- 노드 위치는 레이아웃 알고리즘에 따라 계산
- 게시물 메타데이터(카테고리, 태그 등)에 따른 시각적 차별화

## AI 의사결정 표준

### 코드 수정 우선순위
1. 보안 및 인증 관련 코드
2. 데이터 CRUD 관련 코드
3. 3D 시각화 관련 코드
4. UI/UX 개선 코드

### 기능 구현 접근 방식
1. 구현할 기능의 요구사항 분석
2. 필요한 컴포넌트 및 서비스 파일 식별
3. 데이터 모델 및 서비스 계층 구현
4. UI 컴포넌트 구현
5. 3D 시각화 및 인터랙션 구현

### 성능 최적화 고려사항
- 불필요한 렌더링 방지 (React.memo, useMemo, useCallback 활용)
- Three.js 성능 최적화 (Object Pooling, LOD 기법)
- Firebase 쿼리 최적화 (인덱스 활용, 필요한 필드만 요청)
- 코드 분할 및 지연 로딩 적용

## 금지 사항

### 데이터베이스 스키마 변경 금지
- **DATABASE-SCHEMA.md**에 정의된 데이터베이스 구조 변경 금지
- 컬렉션 구조, 필드명, 데이터 타입 등을 임의로 수정 금지
- 기존 스키마를 준수하는 방식으로만 구현할 것

### 보안 규칙 무시 금지
- 모든 데이터 액세스는 적절한 권한 확인 후 수행할 것
- 익명 사용자의 쓰기 권한 부여 금지
- 인증 없이 민감한 데이터 접근 금지

### 외부 의존성 추가 제한
- PRD에 명시된 기술 스택 외 추가 라이브러리 도입 시 검토 필요
- 새로운 의존성 추가는 절대적으로 필요한 경우에만 허용
- 유지보수성과 호환성을 고려할 것

### 코드 구현 제한사항
- 일관된 코드 스타일 유지
- 중복 코드 작성 금지
- 복잡한 로직은 작은 단위로 분리하여 구현
- 명확한 이름과 주석 사용

### 성능 관련 제한사항
- 대규모 데이터를 한 번에 로드하는 구현 지양
- 3D 렌더링 시 과도한 오브젝트 사용 지양
- 불필요한 상태 업데이트 최소화 