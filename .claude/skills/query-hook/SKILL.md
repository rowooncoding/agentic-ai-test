---
name: query-hook
description: TanStack Query v5 훅과 API 함수를 함께 생성할 때 사용. "API 연동", "훅 만들어줘", "useQuery", "useMutation", "데이터 패칭" 등의 요청에 적용.
---

## 슬래시 커맨드

- `/query` — TanStack Query 훅 생성
- `/hook` — TanStack Query 훅 생성 (단축)
- `/qhook` — TanStack Query 훅 생성 (단축2)

**사용 예시**: `/query getTechVulPlans` → getTechVulPlans 조회 훅 생성

---

> **작업 전 필수 확인**: 기본 기능으로 구현할 수 없는 요구사항은 임의로 추가하지 말고, 구현 여부를 사용자에게 명시적으로 확인받는다.

---

## 폴더 구조

```
src/
├── features/{domain}/api/
│   ├── {domain}Api.ts   ← Axios API 호출만 (Query 로직 금지)
│   └── use{Domain}.ts   ← TanStack Query 훅 (feature 전용)
└── hooks/
    └── use{Domain}.ts   ← 여러 feature 공유 시
```

---

## 핵심 규칙

### API 함수 (`{domain}Api.ts`)
- `src/lib/axios.ts`의 `api` 인스턴스만 사용
- 반환 타입 명시 필수
- Query 관련 코드 포함 금지

### Query Key Factory
- 훅 파일 상단에 팩토리 객체로 반드시 정의, `as const` 필수

```ts
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}
```

### useQuery
- `id` 의존 쿼리는 `enabled: !!id` 필수
- staleTime: 자주 변하는 데이터 10초, 일반 5분, 정적 1시간
- gcTime: staleTime의 5~6배

### useMutation
- `onSuccess`에서 반드시 `invalidateQueries`로 관련 쿼리 무효화
- 낙관적 업데이트 필요 시: `onMutate`(백업) → `onError`(복구) → `onSuccess`(동기화) 순서

---

## 체크리스트

- [ ] Query Key를 훅 파일 상단 팩토리 객체로 정의했는가?
- [ ] API 함수와 훅을 분리했는가?
- [ ] `enabled` 옵션으로 조건부 실행을 처리했는가?
- [ ] Mutation 성공 시 관련 Query를 `invalidateQueries`로 무효화했는가?
- [ ] 서비스 함수의 반환 타입을 명시했는가?
- [ ] `staleTime`과 `gcTime`을 데이터 특성에 맞게 설정했는가?
- [ ] 로딩 상태(`isPending`, `isFetching`)와 에러 상태를 처리했는가?
- [ ] 필요시 Optimistic Update 패턴을 적용했는가?
- [ ] Suspense가 필요한 경우 `useSuspenseQuery`를 사용했는가?
- [ ] 무한 스크롤이 필요한 경우 `useInfiniteQuery`를 적용했는가?
