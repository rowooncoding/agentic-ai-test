import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import type { Example } from '../types'

export function useExamples() {
  return useQuery({
    queryKey: ['examples'],
    queryFn: async () => {
      const { data } = await api.get<Example[]>('/examples')
      return data
    },
  })
}
