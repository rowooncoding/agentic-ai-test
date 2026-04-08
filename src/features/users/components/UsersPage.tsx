import { useState } from 'react'
import type { PaginationState, SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/DataTable'
import { useUsers } from '../api/useUsers'
import { userColumns } from './columns'

function UsersPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 100,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')

  const { data, isLoading } = useUsers({ pagination, sorting, search })

  function handleSearchChange(value: string) {
    setSearch(value)
    // 검색어 변경 시 첫 페이지로 초기화
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <DataTable
        columns={userColumns}
        data={data?.rows ?? []}
        rowCount={data?.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={search}
        onGlobalFilterChange={handleSearchChange}
        isLoading={isLoading}
        toolbar={
          // 툴바 슬롯: 필요 시 버튼 추가
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {data?.total != null ? `${data.total.toLocaleString()}명` : ''}
            </span>
          </div>
        }
      />
    </div>
  )
}

export { UsersPage }
