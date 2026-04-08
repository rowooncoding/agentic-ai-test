# my-vite-project

React + TypeScript + Vite 기반 프론트엔드 프로젝트입니다.

---

## 기술 스택

| 분류 | 라이브러리 | 버전 |
|---|---|---|
| 프레임워크 | React | ^19.2.4 |
| 빌드 도구 | Vite + @vitejs/plugin-react | ^8.0.4 |
| 언어 | TypeScript | ~6.0.2 |
| 라우팅 | React Router DOM | ^7.14.0 |
| 서버 상태 관리 | TanStack Query | ^5.96.2 |
| 클라이언트 상태 관리 | Zustand | ^5.0.12 |
| HTTP 클라이언트 | Axios | ^1.14.0 |
| UI 컴포넌트 | shadcn/ui | ^4.1.2 |
| 테이블 | TanStack Table | ^8.21.3 |
| 트리 뷰 | react-arborist | ^3.4.3 |
| 리치 텍스트 에디터 | Tiptap | ^3.22.2 |
| 드래그 앤 드롭 | @dnd-kit/core | ^6.3.1 |
| 파일 업로드 | react-dropzone | ^15.0.0 |
| 스타일링 | Tailwind CSS v4 | ^4.2.2 |
| 날짜 처리 | Day.js | ^1.11.20 |
| 차트 | Recharts | ^3.8.1 |

---

## 시작하기

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 프로젝트 구조

```
src/
├── app/                        # 앱 진입점 설정
│   ├── providers.tsx           # QueryClient, RouterProvider 조합
│   └── router.tsx              # React Router 라우트 정의
│
├── assets/                     # 이미지, 폰트 등 정적 파일
│
├── components/                 # 전역 공용 컴포넌트
│   ├── ui/                     # shadcn/ui 자동 생성 컴포넌트
│   └── layout/                 # Header, Sidebar 등 레이아웃 컴포넌트
│
├── features/                   # 도메인(기능) 단위 모듈
│   └── [feature-name]/
│       ├── api/                # TanStack Query hooks (useQuery, useMutation)
│       ├── components/         # 해당 기능 전용 UI 컴포넌트
│       ├── store/              # Zustand slice
│       └── types.ts            # 해당 기능 TypeScript 타입
│
├── hooks/                      # 전역 공용 custom hooks
│
├── lib/
│   ├── axios.ts                # axios 인스턴스 및 interceptor 설정
│   └── utils.ts                # shadcn cn() 유틸 함수
│
├── pages/                      # React Router와 연결되는 페이지 컴포넌트
│
├── store/                      # 전역 Zustand store (slice re-export)
│
├── types/                      # 전역 공용 TypeScript 타입/인터페이스
│
├── utils/                      # 순수 유틸리티 함수
│
├── index.css                   # 전역 스타일 + Tailwind CSS + shadcn 테마
└── main.tsx                    # 앱 루트 마운트
```

---

## 설정 상세

### Tailwind CSS v4

`@tailwindcss/vite` 플러그인 방식을 사용합니다. 별도의 `tailwind.config.ts` 없이 `vite.config.ts`에서 플러그인으로 등록합니다.

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

CSS 진입점에서 import:

```css
/* src/index.css */
@import "tailwindcss";
```

### 경로 별칭 (Path Alias)

`@`가 `src/`를 가리킵니다.

```ts
// vite.config.ts
resolve: {
  alias: { '@': path.resolve(__dirname, './src') },
}
```

```ts
// tsconfig.app.json
"paths": { "@/*": ["./src/*"] }
```

사용 예시:

```ts
import { api } from '@/lib/axios'
import { useExampleStore } from '@/features/example/store/exampleStore'
```

### shadcn/ui

컴포넌트 추가:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
```

생성된 컴포넌트는 `src/components/ui/`에 위치합니다.

### Axios 인스턴스

`src/lib/axios.ts`에 기본 인스턴스가 설정되어 있습니다.

```ts
import { api } from '@/lib/axios'

const { data } = await api.get('/endpoint')
```

환경 변수 `VITE_API_BASE_URL`로 baseURL을 지정할 수 있습니다 (기본값: `/api`).

### 새 Feature 추가 패턴

```
src/features/user/
├── api/
│   └── useUsers.ts       # useQuery / useMutation
├── components/
│   └── UserList.tsx
├── store/
│   └── userStore.ts      # Zustand slice
└── types.ts
```

---

## 환경 변수

프로젝트 루트에 `.env` 파일을 생성하세요.

```env
VITE_API_BASE_URL=https://api.example.com
```

> Vite 환경 변수는 반드시 `VITE_` 접두사가 필요합니다.
