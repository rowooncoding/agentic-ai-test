# features 작성 규칙

각 feature는 도메인 단위로 폴더를 나누고, 아래 구조를 따른다.

## 폴더 구조

```
src/features/{domain}/
├── api/
│   ├── {domain}Api.ts     ← Axios API 호출 함수만 담당
│   └── use{Domain}.ts     ← TanStack Query 훅 (해당 feature 전용)
├── components/            ← feature 전용 컴포넌트
├── store/                 ← feature 전용 전역 상태 (필요 시)
└── types.ts               ← feature 전용 타입 정의
```

## api/ 폴더 규칙

### API 함수 (`{domain}Api.ts`)
- `src/lib/axios.ts`의 `api` 인스턴스만 사용한다
- API 호출 로직만 담는다 — Query 관련 코드 혼입 금지
- 모든 함수의 반환 타입을 명시한다

```ts
// src/features/users/api/usersApi.ts
import { api } from '@/lib/axios'
import type { User } from '../types'

export const usersApi = {
  getAll: (): Promise<User[]> =>
    api.get('/users').then((res) => res.data),

  getById: (id: string): Promise<User> =>
    api.get(`/users/${id}`).then((res) => res.data),
}
```

### Query 훅 (`use{Domain}.ts`)
- 이 feature에서만 사용하는 훅은 여기에 둔다
- 여러 feature에서 공유하는 훅은 `src/hooks/`로 이동한다
- QueryKey Factory를 파일 상단에 반드시 정의한다

```ts
// src/features/users/api/useUsers.ts
import { useQuery } from '@tanstack/react-query'
import { usersApi } from './usersApi'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: usersApi.getAll,
    staleTime: 1000 * 60 * 5,
  })
}
```
