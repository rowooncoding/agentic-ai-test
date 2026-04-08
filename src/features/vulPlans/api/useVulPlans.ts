import { useQuery } from '@tanstack/react-query'
import { vulPlansApi } from './vulPlansApi'

export const vulPlanKeys = {
  all: ['vulPlans'] as const,
  lists: () => [...vulPlanKeys.all, 'list'] as const,
  detail: (id: string) => [...vulPlanKeys.all, 'detail', id] as const,
}

export function useVulPlans() {
  return useQuery({
    queryKey: vulPlanKeys.lists(),
    queryFn: vulPlansApi.getAll,
    staleTime: 1000 * 60 * 5,  // 5분
    gcTime: 1000 * 60 * 30,    // 30분
  })
}

export function useVulPlan(id: string | null) {
  return useQuery({
    queryKey: vulPlanKeys.detail(id ?? ''),
    queryFn: () => vulPlansApi.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}
