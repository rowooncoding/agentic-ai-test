---
name: table
description: TanStack Table v8로 정렬, 필터, 페이지네이션, 행 선택이 있는 테이블을 생성할 때 사용. "테이블", "그리드", "정렬", "필터", "페이지네이션", "행 선택", "DataTable", "kendoGrid 대체" 등의 요청에 적용.
---

## 슬래시 커맨드

- `/table` — TanStack Table 컴포넌트 생성

**사용 예시**: `/table users` → users 테이블 생성

---

> **작업 전 필수 확인**
> 기능은 설정된 라이브러리의 기본 기능 범위 안에서 구현한다. 기본 기능으로 구현할 수 없는 요구사항은 임의로 추가하지 말고, 구현 여부를 사용자에게 명시적으로 확인받는다.

**사용 라이브러리:** `@tanstack/react-table ^8.x` + shadcn `Table`, `Checkbox` 컴포넌트

---

## 폴더 구조

```
src/
├── components/
│   └── data-table/
│       └── DataTable.tsx     ← 재사용 공통 테이블
└── features/{domain}/
    └── components/
        └── columns.tsx       ← feature 전용 컬럼 정의
```

---

## 1단계: 컬럼 정의

```tsx
// src/features/users/components/columns.tsx

import { type ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { User } from '@/types/user'

export const userColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
  },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'email', header: '이메일' },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button variant="ghost" size="sm">편집</Button>
    ),
  },
]
```

---

## 2단계: DataTable 컴포넌트

```tsx
// src/components/data-table/DataTable.tsx

import {
  flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  useReactTable, type ColumnDef, type SortingState, type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  searchKey?: string
}

function DataTable<TData>({ columns, data, searchKey }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
  })

  return (
    <div className="flex flex-col gap-4">
      {searchKey && (
        <Input
          placeholder="검색..."
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      )}
      {/* 표준 Table/TableHeader/TableBody/TableRow/TableCell 구조로 렌더링. 헤더는 table.getHeaderGroups().map(), 바디는 table.getRowModel().rows.map() 순회 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {!h.isPlaceholder && flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>이전</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>다음</Button>
      </div>
    </div>
  )
}

export { DataTable }
```

---

## [기본값] 기능 명세

> 아래 기능은 DataTable 생성 시 **무조건 포함**되어야 하는 필수 기능입니다.

### 1. 서버사이드 페이징 (TanStack Query 연동)

TanStack Query와 `getPaginationRowModel()`을 결합하여 서버사이드 페이징 구현.

**추가 설정:**
```typescript
const table = useReactTable({
  // ... 기본 설정
  state: { pagination },
  manualPagination: true,
  rowCount: data?.total,
})
```

- 기본 `pageSize` **100**, 선택지 100 / 500 / 1000
- 한국어 페이징 메시지 `"전체 N건 중 X - Y건"` 형식으로 표시

### 2. 체크박스 선택

`getSelectedRowModel()`, `onRowSelectionChange` 상태로 구현.

**추가 설정:**
```typescript
const table = useReactTable({
  // ... 기본 설정
  state: { rowSelection },
  enableRowSelection: true,
  onRowSelectionChange: setRowSelection,
  getSelectedRowModel: getSelectedRowModel(),
})

const selectedRows = table.getSelectedRowModel().rows
```

- 행 단건·다건 선택 지원
- 헤더 체크박스로 현재 페이지 전체 선택·해제
- 페이지 이동 시에도 선택 상태 유지

### 3. 컬럼 리사이즈 · 순서 변경

`columnResizeMode: 'onChange'` 설정으로 실시간 리사이즈.

**추가 설정:**
```typescript
const table = useReactTable({
  // ... 기본 설정
  columnResizeMode: 'onChange',
  state: { columnSizing, columnSizingInfo },
  onColumnSizingChange: setColumnSizing,
  onColumnSizingInfoChange: setColumnSizingInfo,
})
```

- 컬럼 너비를 드래그로 조절
- 컬럼 헤더를 드래그하여 순서 변경 (필요시 `@dnd-kit/core` 라이브러리 활용)

### 4. 정렬

`getSortedRowModel()`, `onSortingChange`로 정렬 구현.

**추가 설정:**
```typescript
const table = useReactTable({
  // ... 기본 설정
  state: { sorting },
  onSortingChange: setSorting,
  getSortedRowModel: getSortedRowModel(),
})
```

- 컬럼 헤더 클릭으로 오름차순·내림차순 정렬
- 다중 컬럼 정렬 지원 (Shift + Click)
- 서버사이드 정렬의 경우 `manualSorting: true` 설정 후 쿼리에 정렬 조건 포함

### 5. 전역 필터 및 컬럼별 필터

`getFilteredRowModel()` 활용으로 필터링.

**추가 설정:**
```typescript
const table = useReactTable({
  // ... 기본 설정
  state: { globalFilter, columnFilters },
  onGlobalFilterChange: setGlobalFilter,
  onColumnFiltersChange: setColumnFilters,
  globalFilterFn: 'fuzzy',
  getFilteredRowModel: getFilteredRowModel(),
})
```

- 전역 검색창에서 모든 컬럼 동시 검색
- 컬럼별 개별 필터 (필요시 추가)

### 6. 툴바

그리드 상단 영역에 검색 입력, 드롭다운 필터, 액션 버튼을 자유롭게 배치.

전역 검색 Input + 액션 Button을 flex 컨테이너에 배치하여 도구 모음 구성.

> 툴바에 **날짜 필터(DatePicker)**를 배치할 경우 datepicker 스킬을 함께 읽을 것.

### 7. 상태 뱃지 셀

shadcn/ui Badge 컴포넌트를 활용하여 enum 값을 색상 뱃지로 렌더링.

```typescript
const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'active': 'default',       // 초록
    'pending': 'secondary',    // 노랑
    'failed': 'destructive',   // 빨강
    'inactive': 'outline',     // 회색
  }
  return <Badge variant={variants[status]}>{status}</Badge>
}
```

- **완료/활성** → 초록 (default)
- **진행중** → 노랑 (secondary)
- **실패** → 빨강 (destructive)
- **미진행/비활성** → 회색 (outline)

### 8. 날짜 포맷 셀

`date-fns` 라이브러리를 활용하여 `yyyy-MM-dd` 형식으로 통일 표시.

```typescript
import { format } from 'date-fns'

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'createdAt',
    header: '생성일',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'yyyy-MM-dd'),
  },
]
```

### 9. 빈 데이터 · 로딩 상태

**로딩 상태 — 스켈레톤 행:**

스켈레톤 행: `Array(rowCount).fill(0).map`으로 각 열에 Skeleton 컴포넌트 렌더링

**빈 데이터 상태:**

`table.getRowModel().rows.length === 0`일 때 colSpan으로 메시지 표시

### 10. 헤더 고정 · 바디 스크롤

`sticky top-0 bg-muted/50 z-40` 클래스로 헤더 고정, `overflow-y-auto` 클래스로 바디 영역만 세로 스크롤

- 테이블 헤더를 상단에 고정
- 바디 영역만 세로·가로 스크롤
- 가로 스크롤 시 헤더와 바디 동기화

---

## 체크리스트

- [ ] `ColumnDef<T>` 타입을 명시했는가?
- [ ] `columnFilters` 상태와 `onColumnFiltersChange`를 `useReactTable`에 연결했는가?
- [ ] 행 선택이 필요하면 `select` 컬럼을 추가했는가?
- [ ] 빈 데이터 상태 UI를 처리했는가? (`"해당 데이터가 존재하지 않습니다."`)
- [ ] `data`가 undefined일 때 기본값(`[]`)을 지정했는가?
- [ ] 서버사이드 페이징이 적용되었는가? (기본 pageSize 100, TanStack Query 연동)
- [ ] 체크박스 선택(단건·다건·헤더 전체선택)이 구현되었는가?
- [ ] 컬럼 리사이즈·순서 변경이 동작하는가?
- [ ] 정렬이 구현되었는가? (오름차순·내림차순, 다중 컬럼)
- [ ] 전역 필터 및 컬럼별 필터가 적용되었는가?
- [ ] 툴바 슬롯 구조가 적용되었는가?
- [ ] 상태 뱃지 셀이 shadcn/ui Badge로 색상 코드에 따라 렌더링되는가?
- [ ] 날짜 셀이 `date-fns`로 `yyyy-MM-dd` 형식으로 표시되는가?
- [ ] 로딩 상태에서 스켈레톤 행이 표시되는가?
- [ ] 헤더 고정·바디 스크롤이 적용되었는가?
