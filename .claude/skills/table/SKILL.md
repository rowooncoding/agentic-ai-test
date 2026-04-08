---
name: table
description: TanStack Table v8로 정렬, 필터, 페이지네이션, 행 선택이 있는 테이블을 생성할 때 사용. "테이블", "그리드", "정렬", "필터", "페이지네이션", "행 선택", "DataTable", "kendoGrid 대체" 등의 요청에 적용.
---

## 슬래시 커맨드

- `/table` — TanStack Table 컴포넌트 생성

**사용 예시**: `/table users` → users 테이블 생성

---

> **작업 전 필수 확인**: 기본 기능으로 구현할 수 없는 요구사항은 임의로 추가하지 말고, 구현 여부를 사용자에게 명시적으로 확인받는다.

**사용 라이브러리:** `@tanstack/react-table ^8.x` + shadcn `Table`, `Checkbox` 컴포넌트

---

## 작업 시작 전 필수 읽기

`src/components/data-table/DataTable.tsx`를 반드시 읽는다.

- **새로운 DataTable 컴포넌트를 만들지 않는다.** 기존 컴포넌트를 재사용한다.
- 아래 Props 인터페이스를 그대로 따른다. 임의로 변경하거나 생략하지 않는다.

```ts
interface DataTableProps<TData> {
  // 필수
  columns: ColumnDef<TData>[]
  data: TData[]
  rowCount: number                              // 서버 전체 행 수

  // 부모가 소유 — 변경 시 서버 API 재호출 필요
  pagination: PaginationState                   // { pageIndex, pageSize }
  onPaginationChange: OnChangeFn<PaginationState>
  sorting: SortingState                         // [{ id, desc }]
  onSortingChange: OnChangeFn<SortingState>

  // 선택적
  globalFilter?: string                         // 검색어 (서버로 전달)
  onGlobalFilterChange?: (value: string) => void
  isLoading?: boolean                           // 스켈레톤 표시
  toolbar?: React.ReactNode                     // 툴바 슬롯 (버튼 등 주입)
}
```

> **상태 소유 원칙**: `pagination` · `sorting` · `globalFilter`는 부모가 소유한다 (서버 API 연동).
> `rowSelection` · `columnOrder` · `columnSizing`은 DataTable 내부에서 관리한다 (UI only).

---

## 폴더 구조

```
src/
├── components/data-table/
│   └── DataTable.tsx      ← 재사용 공통 테이블
└── features/{domain}/components/
    └── columns.tsx         ← feature 전용 컬럼 정의
```

---

## 필수 기능 명세

> 아래 기능은 DataTable 생성 시 **무조건 포함**되어야 합니다.

| 기능 | 핵심 규칙 |
|------|---------|
| **서버사이드 페이징** | `manualPagination: true`, `rowCount: data?.total`, 기본 pageSize **100**, 선택지 100/500/1000, 한국어 메시지 `"전체 N건 중 X - Y건"` |
| **체크박스 선택** | 단건·다건·헤더 전체선택·해제, 페이지 이동 시 선택 상태 유지 |
| **컬럼 리사이즈·순서 변경** | `columnResizeMode: 'onChange'`, 순서 변경은 `@dnd-kit/core` 활용 |
| **정렬** | 헤더 클릭으로 오름·내림차순, `manualSorting: true`로 서버사이드 정렬, 쿼리에 정렬 조건 포함 |
| **전역 필터** | 검색창에서 전체 컬럼 동시 검색 |
| **툴바** | 검색 Input + 액션 Button을 flex 컨테이너에 배치 |
| **상태 뱃지** | shadcn/ui Badge: 완료/활성→초록, 진행중→노랑, 실패→빨강, 비활성→회색 |
| **날짜 포맷** | `dayjs`로 `YYYY-MM-DD` 형식 통일 |
| **로딩 상태** | 스켈레톤 행으로 표시 |
| **헤더 고정** | `sticky top-0 bg-muted/50 z-40`, 바디는 `overflow-y-auto` |
| **빈 데이터** | `colSpan`으로 `"해당 데이터가 존재하지 않습니다."` 메시지 표시 |

---

## 체크리스트

- [ ] `ColumnDef<T>` 타입을 명시했는가?
- [ ] 서버사이드 페이징이 적용되었는가? (기본 pageSize 100, TanStack Query 연동)
- [ ] 체크박스 선택(단건·다건·헤더 전체선택)이 구현되었는가?
- [ ] 컬럼 리사이즈·순서 변경이 동작하는가?
- [ ] 정렬이 구현되었는가? (오름차순·내림차순, 서버사이드)
- [ ] 전역 필터가 적용되었는가?
- [ ] 툴바 슬롯 구조가 적용되었는가?
- [ ] 상태 뱃지 셀이 shadcn/ui Badge로 색상에 따라 렌더링되는가?
- [ ] 날짜 셀이 `dayjs`로 `YYYY-MM-DD` 형식으로 표시되는가?
- [ ] 로딩 상태에서 스켈레톤 행이 표시되는가?
- [ ] 헤더 고정·바디 스크롤이 적용되었는가?
- [ ] 빈 데이터 상태 UI를 처리했는가?
- [ ] `data`가 undefined일 때 기본값(`[]`)을 지정했는가?
- [ ] `columnFilters` 상태와 `onColumnFiltersChange`를 `useReactTable`에 연결했는가?
