# harness.md — 테스트 하네스 엔지니어링 규칙

> 이 파일은 `CLAUDE.md`에서 `@import`하여 사용합니다.
> 테스트 작성, Mock 구성, 커버리지 기준, CI 연동에 관한 모든 규칙을 정의합니다.

---

## 개발 워크플로우

모든 기능 구현은 아래 순서를 반드시 따릅니다.

1. 요구사항 분석 후 테스트 케이스 목록을 먼저 제시하고 사용자의 승인을 받는다
2. 승인된 테스트 케이스를 `.test.ts(x)` 파일로 작성한다
3. 테스트가 실패하는 것을 확인한다 (Red)
4. 테스트가 통과하도록 기능을 구현한다 (Green)
5. 코드를 정리한다 (Refactor)
6. 모든 테스트 통과 여부를 확인하고 결과를 보고한다

---

## 사용 프레임워크 & 라이브러리

| 역할 | 라이브러리 | 버전 |
|------|-----------|------|
| 단위/통합 테스트 | `vitest` | `^2.x` |
| React 컴포넌트 테스트 | `@testing-library/react` | `^16.x` |
| DOM 쿼리 확장 | `@testing-library/jest-dom` | `^6.x` |
| 사용자 이벤트 시뮬레이션 | `@testing-library/user-event` | `^14.x` |
| E2E 테스트 | `playwright` | `^1.x` |
| MSW (API 모킹) | `msw` | `^2.x` |

> 작업 전 반드시 위 버전을 명시하고, 프로젝트 `package.json`을 직접 확인하여 실제 버전과 일치 여부를 검증합니다.

---

## 테스트 파일 구조

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.test.tsx       ← 컴포넌트와 동일 위치
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
├── services/
│   ├── userService.ts
│   └── userService.test.ts
└── __tests__/
    └── integration/              ← 통합 테스트 전용 폴더
        └── AuthFlow.test.tsx
```

- ✅ 단위 테스트: 대상 파일과 **동일 디렉터리**에 `.test.ts(x)` 파일로 작성
- ✅ 통합 테스트: `src/__tests__/integration/` 폴더에 작성
- ✅ E2E 테스트: `e2e/` 최상위 폴더에 작성 (Playwright 기본 구조 준수)
- ❌ `__tests__` 폴더를 단위 테스트에 사용 금지 (혼재 방지)

---

## 테스트 네이밍 컨벤션

- `describe`: 테스트 대상 (컴포넌트명 / 함수명 / 훅명)
- `it` / `test`: **한국어**로 작성, `~해야 한다` 형식으로 끝맺음
- 실패 시나리오: `~하면 ~해야 한다` 형식 사용

```ts
// ✅ 올바른 예
describe('useAuth', () => {
  it('로그인 성공 시 user 상태가 업데이트되어야 한다', () => { ... })
  it('토큰 만료 시 자동 로그아웃 되어야 한다', () => { ... })
})

// ❌ 잘못된 예
describe('useAuth', () => {
  it('test1', () => { ... })
  it('works', () => { ... })
})
```

---

## Mock / Stub / Spy 사용 기준

### vi.mock — 모듈 전체 교체

외부 API 호출, 라우터, 스토리지 등 **사이드 이펙트가 있는 모듈**에만 사용합니다.
테스트 파일 상단에 선언하며, 테스트 내부에 인라인 선언은 금지합니다.

```ts
vi.mock('@/services/userService', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: '홍길동' }),
}))
```

### vi.fn() — 함수 단위 스파이

```ts
const onSubmit = vi.fn()
render(<Form onSubmit={onSubmit} />)
await userEvent.click(screen.getByRole('button', { name: '제출' }))
expect(onSubmit).toHaveBeenCalledTimes(1)
expect(onSubmit).toHaveBeenCalledWith({ name: '홍길동' })
```

### MSW — API 네트워크 모킹

통합 테스트에서 API 호출이 포함된 경우 우선 사용합니다.
`vi.mock`으로 fetch를 직접 모킹하는 방식은 지양합니다.

```ts
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'

server.use(
  http.get('/api/users', () => HttpResponse.json([{ id: 1, name: '홍길동' }]))
)
```

### 사용 금지 패턴

- ❌ `vi.spyOn`을 남용하여 내부 구현 세부사항 검증 금지
- ❌ 테스트 간 mock 상태 공유 금지 → `afterEach`에서 `vi.clearAllMocks()` 필수
- ❌ 실제 `localStorage`, `sessionStorage` 직접 접근 금지 → 모킹 유틸 사용

---

## 커버리지 기준

| 대상 | 최소 커버리지 |
|------|-------------|
| `src/hooks/` | **90%** 이상 |
| `src/services/` | **90%** 이상 |
| `src/components/` | **80%** 이상 |
| `src/utils/` | **85%** 이상 |
| E2E (Critical Path) | 핵심 사용자 플로우 **100%** 커버 |

- 커버리지 기준 미달 시 PR 병합 불가
- UI 전용 스타일 컴포넌트(아이콘, 레이아웃 래퍼 등)는 `/* c8 ignore */` 예외 처리 가능

```ts
// vitest.config.ts
coverage: {
  thresholds: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  }
}
```

---

## 테스트 작성 원칙

### 1. 구현이 아닌 행동(Behavior)을 테스트한다

```ts
// ❌ 구현 세부사항 검증
expect(component.state.isLoading).toBe(false)

// ✅ 사용자 관점의 행동 검증
expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
```

### 2. 쿼리 우선순위 준수

`getByRole` → `getByLabelText` → `getByPlaceholderText` → `getByText` → `getByDisplayValue` → `getByAltText` → `getByTitle` → `getByTestId` (최후 수단)

- ❌ `getByTestId` 남용 금지 — 접근성 기반 쿼리로 대체 우선 시도

### 3. AAA 패턴 준수

```ts
it('검색어 입력 시 필터링된 결과가 표시되어야 한다', async () => {
  // Arrange
  render(<UserList users={mockUsers} />)

  // Act
  await userEvent.type(screen.getByRole('searchbox'), '홍길동')

  // Assert
  expect(screen.getByText('홍길동')).toBeInTheDocument()
  expect(screen.queryByText('김철수')).not.toBeInTheDocument()
})
```

### 4. 비동기 처리

```ts
// ✅ waitFor / findBy 사용
expect(await screen.findByText('로드 완료')).toBeInTheDocument()

// ❌ 임의의 setTimeout/sleep 금지
await new Promise(r => setTimeout(r, 1000))
```

---

## CI 연동 규칙

- **PR 머지 조건**: 단위/통합 테스트 통과 + 커버리지 기준 충족 + E2E 통과
- 테스트 실패 시 `.skip` 처리 후 머지 **금지** — 반드시 수정 후 머지
- `it.only` / `test.only` 커밋 금지 (린트 규칙으로 강제)

```yaml
# .github/workflows/ci.yml 기준
steps:
  - name: 단위/통합 테스트
    run: pnpm test:ci
  - name: 커버리지 임계값 검증
    run: pnpm test:coverage
  - name: E2E 테스트
    run: pnpm playwright test
```

---

## 작업 완료 체크리스트

- [ ] 테스트 파일 위치가 컨벤션에 맞는가?
- [ ] 테스트명이 한국어 `~해야 한다` 형식인가?
- [ ] `vi.mock` / MSW 사용이 적절한가? (남용 여부 점검)
- [ ] `afterEach`에서 mock 초기화가 이루어지는가?
- [ ] 커버리지 임계값을 충족하는가?
- [ ] `getByTestId` 남용 없이 접근성 기반 쿼리를 우선 사용했는가?
- [ ] CI 파이프라인에서 테스트가 통과하는가?
