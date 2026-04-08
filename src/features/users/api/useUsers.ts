import { useQuery } from '@tanstack/react-query'
import type { PaginationState, SortingState } from '@tanstack/react-table'
import { usersApi } from './usersApi'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (page: number, limit: number, sorting?: SortingState, search?: string) =>
    [...userKeys.lists(), { page, limit, sorting, search }] as const,
}

interface UseUsersParams {
  pagination: PaginationState
  sorting?: SortingState
  search?: string
}

export function useUsers({ pagination, sorting, search }: UseUsersParams) {
  const { pageIndex, pageSize } = pagination
  const sort = sorting?.[0]

  return useQuery({
    queryKey: userKeys.list(pageIndex, pageSize, sorting, search),
    queryFn: () =>
      usersApi.getList({
        page: pageIndex,
        limit: pageSize,
        sort: sort?.id,
        order: sort ? (sort.desc ? 'desc' : 'asc') : undefined,
        search: search || undefined,
      }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev, // 페이지 전환 시 이전 데이터 유지
  })
}
