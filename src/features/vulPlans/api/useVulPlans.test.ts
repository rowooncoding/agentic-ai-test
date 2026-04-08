import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { server } from '@/mocks/server'
import { useVulPlans, useVulPlan } from './useVulPlans'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // 테스트에서 재시도 비활성화
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('useVulPlans', () => {
  it('목록 조회 성공 시 데이터를 반환해야 한다', async () => {
    const { result } = renderHook(() => useVulPlans(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].id).toBe('1')
    expect(result.current.data?.[0].title).toBe('취약점 점검 계획 A')
  })

  it('API 호출 실패 시 에러 상태가 되어야 한다', async () => {
    server.use(
      http.get('/api/vul-plans', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useVulPlans(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useVulPlan', () => {
  it('id가 null이면 API를 호출하지 않아야 한다', async () => {
    const { result } = renderHook(() => useVulPlan(null), {
      wrapper: createWrapper(),
    })

    // enabled: false 이므로 pending 상태를 유지해야 함
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('유효한 id로 단건 데이터를 반환해야 한다', async () => {
    const { result } = renderHook(() => useVulPlan('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.id).toBe('1')
    expect(result.current.data?.title).toBe('취약점 점검 계획 A')
  })

  it('존재하지 않는 id 요청 시 에러 상태가 되어야 한다', async () => {
    const { result } = renderHook(() => useVulPlan('999'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
