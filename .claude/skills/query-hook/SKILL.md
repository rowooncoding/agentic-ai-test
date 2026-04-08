---
name: query-hook
description: TanStack Query v5 훅과 API 함수를 함께 생성할 때 사용. "API 연동", "훅 만들어줘", "useQuery", "useMutation", "데이터 패칭" 등의 요청에 적용.
---

## 슬래시 커맨드

이 스킬은 다음 커맨드로 실행할 수 있습니다:

- `/query` — TanStack Query 훅 생성
- `/hook` — TanStack Query 훅 생성 (단축)
- `/qhook` — TanStack Query 훅 생성 (단축2)

**사용 예시**: `/query getTechVulPlans` → getTechVulPlans 조회 훅 생성

---

> **작업 전 필수 확인**

> 기능은 설정된 라이브러리의 기본 기능 범위 안에서 구현한다. 기본 기능으로 구현할 수 없는 요구사항은 임의로 추가하지 말고, 구현 여부를 사용자에게 명시적으로 확인받는다.
> 

TanStack Query v5 (@tanstack/react-query) + Axios로 서버 상태를 관리할 때 따르는 패턴이다.

`src/features/{domain}/api/`에 API 호출 함수와 훅을 함께 두되, 여러 feature에서 공유하는 훅은 `src/hooks/`로 분리하는 것이 핵심이다.

---

## 폴더 구조

```
src/
├── features/
│   └── users/
│       └── api/
│           ├── usersApi.ts   ← Axios API 호출 함수만 담당
│           └── useUsers.ts   ← TanStack Query v5 훅 (feature 전용)
└── hooks/
    └── useUsers.ts           ← 여러 feature에서 공유하는 훅만
```

---

## 1단계: API 함수 작성 (`src/features/{domain}/api/{domain}Api.ts`)

Axios 인스턴스를 사용하고, 반환 타입을 명시한다.

API 호출 로직만 담고 Query 관련 코드는 넣지 않는다.

```tsx
// src/features/users/api/usersApi.ts

import { api } from '@/lib/axios'  // Axios 인스턴스
import type { User, CreateUserDto, UpdateUserDto } from '@/types/user'

export const userApi = {
  getAll: (): Promise<User[]> =>
    api.get('/users').then((res) => res.data),

  getById: (id: string): Promise<User> =>
    api.get(`/users/${id}`).then((res) => res.data),

  create: (dto: CreateUserDto): Promise<User> =>
    api.post('/users', dto).then((res) => res.data),

  update: (id: string, dto: UpdateUserDto): Promise<User> =>
    api.patch(`/users/${id}`, dto).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/users/${id}`).then((res) => res.data),
}
```

---

## 2단계: Query 훅 작성 (`src/hooks/`)

```tsx
// src/features/users/api/useUsers.ts  (feature 전용)
// 또는 src/hooks/useUsers.ts          (여러 feature 공유 시)

import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { userApi } from '@/features/users/api/usersApi'
import type { CreateUserDto, UpdateUserDto } from '@/types/user'

// Query Key Factory 패턴: 훅 파일 상단에 팩토리 객체로 정의
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}

// 목록 조회 (staleTime: 5분, gcTime: 30분)
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: userApi.getAll,
    staleTime: 1000 * 60 * 5,  // 5분간 캐시 유지
    gcTime: 1000 * 60 * 30,    // 30분 후 가비지 수집
  })
}

// 단건 조회 (enabled: id 있을 때만 실행)
export function useUser(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => userApi.getById(id!),
    enabled: !!id,  // id가 있을 때만 실행
    staleTime: 1000 * 60 * 10,
  })
}

// Suspense 옵션 활용 패턴 (v5: useSuspenseQuery 별도 import)
export function useUserWithSuspense(id: string) {
  return useSuspenseQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getById(id),
  })
}

// 생성 (성공 시 목록 쿼리 무효화)
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateUserDto) => userApi.create(dto),
    onSuccess: (newUser) => {
      // 목록 쿼리 무효화 및 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      
      // 또는 낙관적 업데이트: 새로운 데이터를 즉시 캐시에 추가
      // queryClient.setQueryData(userKeys.lists(), (old) => 
      //   old ? [...old, newUser] : [newUser]
      // )
    },

  })
}

// 수정 (단건 상세 쿼리와 목록 쿼리 모두 무효화)
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      userApi.update(id, dto),
    onSuccess: (updatedUser, { id }) => {
      // 단건 상세 쿼리와 목록 쿼리 모두 무효화
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// 삭제 (목록 쿼리 무효화)
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: (_, deletedId) => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      
      // 또는 캐시에서 직접 제거
      // queryClient.setQueryData(userKeys.lists(), (old) =>
      //   old?.filter((user) => user.id !== deletedId)
      // )
    },
  })
}

// Optimistic Update 패턴 (낙관적 업데이트)
export function useUpdateUserOptimistic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      userApi.update(id, dto),
    
    // Mutation 시작 전 낙관적으로 캐시 업데이트
    onMutate: async ({ id, dto }) => {
      // 진행 중인 쿼리 취소 (우리가 설정한 값이 덮어쓰기되지 않도록)
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) })
      
      // 이전 데이터 백업
      const previousUser = queryClient.getQueryData(userKeys.detail(id))
      
      // 새 데이터로 낙관적 업데이트
      queryClient.setQueryData(userKeys.detail(id), (old) => ({
        ...old,
        ...dto,
      }))
      
      return { previousUser }
    },
    
    // 성공 시 서버 데이터로 동기화
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
    
    // 실패 시 이전 데이터 복구
    onError: (error, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(
          userKeys.detail(variables.id),
          context.previousUser
        )
      }
    },
  })
}

// useInfiniteQuery 패턴 (페이지네이션, 무한 스크롤)
export function useInfiniteUsers(pageSize = 10) {
  return useInfiniteQuery({
    queryKey: userKeys.all,
    queryFn: ({ pageParam = 0 }) =>
      userApi.getAll({ offset: pageParam, limit: pageSize }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === pageSize ? pages.length : undefined
    },
    initialPageParam: 0,
  })
}
```

---

## 캐시 설정 가이드

**staleTime vs gcTime:**
- **staleTime**: 데이터가 신선한 상태로 유지되는 시간. 이 시간 내에는 같은 쿼리를 다시 실행해도 캐시된 데이터 사용 (기본값: 0)
- **gcTime**: 데이터가 메모리에 유지되는 시간. staleTime 이후에도 이 시간 동안은 메모리에 보관하여 사용자가 다시 돌아올 때를 대비 (기본값: 5분)

```tsx
export function useFrequentlyChangingData() {
  return useQuery({
    queryKey: ['frequent'],
    queryFn: fetchFrequentData,
    staleTime: 1000 * 10,      // 10초 (자주 변함)
    gcTime: 1000 * 60 * 5,     // 5분
  })
}
```

---

## Axios 인스턴스

항상 `src/lib/axios.ts`의 `api` 인스턴스를 import해서 사용한다.

---

## 체크리스트

- [ ]  Query Key를 훅 파일 상단 팩토리 객체로 정의했는가?
- [ ]  API 함수(`src/features/{domain}/api/{domain}Api.ts`)와 훅을 분리했는가?
- [ ]  `enabled` 옵션으로 조건부 실행을 처리했는가? (id 의존 쿼리 등)
- [ ]  Mutation 성공 시 관련 Query를 `invalidateQueries`로 무효화했는가?
- [ ]  서비스 함수의 반환 타입을 명시했는가?
- [ ]  `staleTime`과 `gcTime`을 데이터 특성에 맞게 설정했는가?
- [ ]  로딩 상태(`isPending`, `isFetching`)와 에러 상태를 처리했는가?
- [ ]  필요시 Optimistic Update 패턴을 적용했는가?
- [ ]  Suspense 옵션이 필요한 경우 추가했는가?
- [ ]  useInfiniteQuery가 필요한 경우 구현했는가?
