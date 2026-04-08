import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { server } from '@/mocks/server'
import { useUsers } from './useUsers'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('useUsers', () => {
  it('성공 시 users 목록과 total이 반환되어야 한다', async () => {
    const { result } = renderHook(
      () =>
        useUsers({
          pagination: { pageIndex: 0, pageSize: 100 },
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.rows).toHaveLength(5)
    expect(result.current.data?.total).toBe(5)
    expect(result.current.data?.rows[0].name).toBe('홍길동')
  })

  it('pagination 상태가 변경되면 다른 페이지 데이터를 요청해야 한다', async () => {
    // pageSize=2, pageIndex=0 → 2건
    const { result, rerender } = renderHook(
      ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) =>
        useUsers({ pagination: { pageIndex, pageSize } }),
      {
        wrapper: createWrapper(),
        initialProps: { pageIndex: 0, pageSize: 2 },
      },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.rows).toHaveLength(2)

    // pageIndex=1 → 나머지 2건
    rerender({ pageIndex: 1, pageSize: 2 })
    await waitFor(() => expect(result.current.data?.rows).toHaveLength(2))
  })

  it('search 파라미터가 있으면 필터링된 결과를 반환해야 한다', async () => {
    const { result } = renderHook(
      () =>
        useUsers({
          pagination: { pageIndex: 0, pageSize: 100 },
          search: '홍길동',
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.rows).toHaveLength(1)
    expect(result.current.data?.rows[0].name).toBe('홍길동')
  })

  it('API 오류 시 error 상태가 반환되어야 한다', async () => {
    server.use(
      http.get('/api/users', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    const { result } = renderHook(
      () => useUsers({ pagination: { pageIndex: 0, pageSize: 100 } }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
