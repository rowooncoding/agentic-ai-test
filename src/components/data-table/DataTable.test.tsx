import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ColumnDef, type PaginationState, type SortingState } from '@tanstack/react-table'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { DataTable } from './DataTable'

// @dnd-kit은 jsdom에서 포인터 이벤트 미지원으로 드래그 관련 동작은 단위 테스트 범위 외

interface TestRow {
  id: string
  name: string
  email: string
}

const testColumns: ColumnDef<TestRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="전체 선택"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label="행 선택"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
      />
    ),
    enableSorting: false,
  },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'email', header: '이메일' },
]

const mockData: TestRow[] = [
  { id: '1', name: '홍길동', email: 'hong@example.com' },
  { id: '2', name: '김철수', email: 'kim@example.com' },
]

function renderTable(
  overrides: Partial<{
    data: TestRow[]
    rowCount: number
    pagination: PaginationState
    sorting: SortingState
    isLoading: boolean
    globalFilter: string
    onGlobalFilterChange: (v: string) => void
    onPaginationChange: (v: PaginationState | ((prev: PaginationState) => PaginationState)) => void
    onSortingChange: (v: SortingState | ((prev: SortingState) => SortingState)) => void
  }> = {},
) {
  const props = {
    columns: testColumns,
    data: mockData,
    rowCount: mockData.length,
    pagination: { pageIndex: 0, pageSize: 100 } as PaginationState,
    onPaginationChange: vi.fn(),
    sorting: [] as SortingState,
    onSortingChange: vi.fn(),
    isLoading: false,
    ...overrides,
  }
  return render(<DataTable {...props} />)
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('DataTable', () => {
  it('데이터가 있을 때 행이 올바르게 렌더링되어야 한다', () => {
    renderTable()

    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('김철수')).toBeInTheDocument()
    expect(screen.getByText('hong@example.com')).toBeInTheDocument()
  })

  it('데이터가 없을 때 "해당 데이터가 존재하지 않습니다." 메시지가 표시되어야 한다', () => {
    renderTable({ data: [], rowCount: 0 })

    expect(screen.getByText('해당 데이터가 존재하지 않습니다.')).toBeInTheDocument()
  })

  it('로딩 상태일 때 스켈레톤 행이 렌더링되어야 한다', () => {
    renderTable({ isLoading: true })

    // 실제 데이터 행이 없어야 함
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument()
    // animate-pulse 클래스를 가진 스켈레톤이 존재해야 함
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('개별 행 체크박스 클릭 시 해당 행이 selected 상태가 되어야 한다', async () => {
    const user = userEvent.setup()
    renderTable()

    const checkboxes = screen.getAllByRole('checkbox', { name: '행 선택' })
    await user.click(checkboxes[0])

    // 첫 번째 행 selected 상태 확인
    const rows = document.querySelectorAll('tr[data-state="selected"]')
    expect(rows).toHaveLength(1)
  })

  it('헤더 체크박스 클릭 시 현재 페이지 전체 행이 선택되어야 한다', async () => {
    const user = userEvent.setup()
    renderTable()

    const headerCheckbox = screen.getByRole('checkbox', { name: '전체 선택' })
    await user.click(headerCheckbox)

    const selectedRows = document.querySelectorAll('tr[data-state="selected"]')
    expect(selectedRows).toHaveLength(mockData.length)
  })

  it('검색 입력 시 onGlobalFilterChange 콜백이 호출되어야 한다', async () => {
    const user = userEvent.setup()
    const onGlobalFilterChange = vi.fn()
    renderTable({ onGlobalFilterChange, globalFilter: '' })

    const searchInput = screen.getByRole('textbox', { name: '전체 검색' })
    await user.type(searchInput, '홍')

    expect(onGlobalFilterChange).toHaveBeenCalled()
  })

  it('정렬 가능한 컬럼 헤더 클릭 시 onSortingChange 콜백이 호출되어야 한다', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    renderTable({ onSortingChange })

    const nameHeader = screen.getByRole('button', { name: /이름/ })
    await user.click(nameHeader)

    expect(onSortingChange).toHaveBeenCalledTimes(1)
  })

  it('다음 페이지가 없을 때 "다음" 버튼이 비활성화되어야 한다', () => {
    renderTable({ pagination: { pageIndex: 0, pageSize: 100 }, rowCount: 2 })

    const nextButton = screen.getByRole('button', { name: '다음' })
    expect(nextButton).toBeDisabled()
  })

  it('다음 페이지가 있을 때 "다음" 버튼이 활성화되어야 한다', () => {
    // pageSize=1, rowCount=2 → 2페이지 존재
    renderTable({ pagination: { pageIndex: 0, pageSize: 1 }, rowCount: 2 })

    const nextButton = screen.getByRole('button', { name: '다음' })
    expect(nextButton).not.toBeDisabled()
  })

  it('"이전" 버튼은 첫 페이지에서 비활성화되어야 한다', () => {
    renderTable({ pagination: { pageIndex: 0, pageSize: 100 }, rowCount: 2 })

    const prevButton = screen.getByRole('button', { name: '이전' })
    expect(prevButton).toBeDisabled()
  })

  it('페이지 크기 변경 시 onPaginationChange 콜백이 호출되어야 한다', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()
    renderTable({ onPaginationChange })

    const select = screen.getByRole('combobox', { name: '페이지 크기' })
    await user.selectOptions(select, '500')

    expect(onPaginationChange).toHaveBeenCalledWith({ pageIndex: 0, pageSize: 500 })
  })

  it('총 행 수와 현재 범위가 올바른 형식으로 표시되어야 한다', () => {
    renderTable({ rowCount: 5, pagination: { pageIndex: 0, pageSize: 100 } })

    expect(screen.getByText('전체 5건 중 1 - 5건')).toBeInTheDocument()
  })
})
