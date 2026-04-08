import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingInfoState,
  type ColumnSizingState,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, ChevronsUpDown, GripVertical } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ─── 정렬 아이콘 ─────────────────────────────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ChevronUp className="ml-1 h-3.5 w-3.5 shrink-0" />
  if (sorted === 'desc') return <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0" />
  return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40" />
}

// ─── 드래그 가능한 헤더 셀 ────────────────────────────────────────────────────

interface SortableHeaderCellProps {
  id: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

function SortableHeaderCell({ id, children, className, style }: SortableHeaderCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  return (
    <TableHead
      ref={setNodeRef}
      style={{
        ...style,
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
      }}
      className={cn('select-none', className)}
    >
      <span
        className="mr-1 inline-flex cursor-grab items-center opacity-30 hover:opacity-70 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="컬럼 이동"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      {children}
    </TableHead>
  )
}

// ─── DataTable Props ──────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [100, 500, 1000] as const

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  /** 서버사이드 총 행 수 */
  rowCount: number
  /** 서버사이드 페이지 상태 */
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  /** 서버사이드 정렬 상태 */
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  /** 전역 검색어 */
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  isLoading?: boolean
  /** 툴바 슬롯 */
  toolbar?: React.ReactNode
}

// ─── DataTable ────────────────────────────────────────────────────────────────

function DataTable<TData>({
  columns,
  data,
  rowCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  globalFilter = '',
  onGlobalFilterChange,
  isLoading = false,
  toolbar,
}: DataTableProps<TData>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [columnSizingInfo, setColumnSizingInfo] = useState<ColumnSizingInfoState>({
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    columnSizingStart: [],
  })
  const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map((c) => c.id ?? (c as { accessorKey?: string }).accessorKey ?? ''))

  const table = useReactTable({
    data,
    columns,
    rowCount,
    state: {
      pagination,
      sorting,
      columnFilters,
      rowSelection,
      columnSizing,
      columnSizingInfo,
      columnOrder,
      // 전역 필터는 서버로 전달하므로 클라이언트 필터는 비활성화
    },
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: true,
    columnResizeMode: 'onChange',
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // ─── DnD 설정 ──────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setColumnOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  // ─── 페이지 정보 문자열 ──────────────────────────────────────────────────────
  const { pageIndex, pageSize } = table.getState().pagination
  const startRow = rowCount === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, rowCount)
  const paginationLabel = `전체 ${rowCount.toLocaleString()}건 중 ${startRow.toLocaleString()} - ${endRow.toLocaleString()}건`

  const sortableIds = table.getAllLeafColumns().map((col) => col.id)

  return (
    <div className="flex flex-col gap-3">
      {/* 툴바 슬롯 + 전역 검색 */}
      <div className="flex items-center gap-3">
        {onGlobalFilterChange && (
          <Input
            placeholder="검색..."
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="w-64"
            aria-label="전체 검색"
          />
        )}
        {toolbar}
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-md border">
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table style={{ width: table.getTotalSize() }}>
              {/* 헤더 고정 */}
              <TableHeader className="sticky top-0 z-40 bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    <SortableContext
                      items={sortableIds}
                      strategy={horizontalListSortingStrategy}
                    >
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort()
                        const sorted = header.column.getIsSorted()

                        return (
                          <SortableHeaderCell
                            key={header.id}
                            id={header.id}
                            style={{ width: header.getSize() }}
                          >
                            {!header.isPlaceholder && (
                              <span className="inline-flex items-center">
                                {/* 정렬 가능한 헤더 */}
                                {canSort ? (
                                  <button
                                    type="button"
                                    className="inline-flex cursor-pointer items-center font-medium hover:text-foreground"
                                    onClick={header.column.getToggleSortingHandler()}
                                    title={
                                      sorted === false
                                        ? '오름차순 정렬'
                                        : sorted === 'asc'
                                          ? '내림차순 정렬'
                                          : '정렬 해제'
                                    }
                                  >
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                    <SortIcon sorted={sorted} />
                                  </button>
                                ) : (
                                  flexRender(header.column.columnDef.header, header.getContext())
                                )}
                              </span>
                            )}

                            {/* 컬럼 리사이즈 핸들 */}
                            {header.column.getCanResize() && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={cn(
                                  'absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-border opacity-0 hover:opacity-100',
                                  header.column.getIsResizing() && 'bg-primary opacity-100',
                                )}
                                aria-label="컬럼 너비 조절"
                              />
                            )}
                          </SortableHeaderCell>
                        )
                      })}
                    </SortableContext>
                  </TableRow>
                ))}
              </TableHeader>

              {/* 바디 */}
              <TableBody>
                {isLoading ? (
                  // 로딩: 스켈레톤 행
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {columns.map((_, j) => (
                        <TableCell key={`skeleton-${i}-${j}`}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  // 빈 데이터
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      해당 데이터가 존재하지 않습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{paginationLabel}</span>

        <div className="flex items-center gap-3">
          {/* 페이지 크기 선택 */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={(e) =>
                onPaginationChange({ pageIndex: 0, pageSize: Number(e.target.value) })
              }
              className="rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="페이지 크기"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>건</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              다음
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { DataTable, type DataTableProps }
