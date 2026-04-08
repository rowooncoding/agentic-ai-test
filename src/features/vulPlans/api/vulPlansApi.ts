import { api } from '@/lib/axios'
import type { VulPlan } from '../types'

export const vulPlansApi = {
  getAll: (): Promise<VulPlan[]> =>
    api.get('/vul-plans').then((res) => res.data),

  getById: (id: string): Promise<VulPlan> =>
    api.get(`/vul-plans/${id}`).then((res) => res.data),
}
