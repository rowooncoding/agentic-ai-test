# hooks 작성 규칙

`src/hooks/`는 **여러 feature에서 공통으로 사용하는 전역 Query 훅**만 둔다.
특정 feature에서만 사용하는 훅은 `src/features/{domain}/api/` 안에 위치한다.

## Axios 인스턴스
항상 `src/lib/axios.ts`의 `api` 인스턴스를 사용한다. 직접 `axios.create()`하거나 `fetch`를 호출하지 않는다.

```ts
import { api } from '@/lib/axios'
```

## QueryKey Factory 패턴 (필수)
모든 훅은 파일 상단에 QueryKey Factory를 정의한다. 일관된 캐시 무효화를 위해 계층 구조를 유지한다.

```ts
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}
```

## staleTime / gcTime 기본값
- 자주 변하는 데이터: `staleTime: 1000 * 10` (10초), `gcTime: 1000 * 60 * 5` (5분)
- 정적 데이터: `staleTime: 1000 * 60 * 60` (1시간), `gcTime: 1000 * 60 * 60` (1시간)