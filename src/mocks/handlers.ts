import { http, HttpResponse } from 'msw'
import type { VulPlan } from '@/features/vulPlans/types'
import type { User } from '@/features/users/types'

const mockVulPlans: VulPlan[] = [
  {
    id: '1',
    title: '취약점 점검 계획 A',
    description: '1분기 취약점 점검',
    status: 'pending',
    priority: 'high',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
  },
  {
    id: '2',
    title: '취약점 점검 계획 B',
    description: '2분기 취약점 점검',
    status: 'in_progress',
    priority: 'medium',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
  },
]

const mockUsers: User[] = [
  { id: '1', name: '홍길동', email: 'hong@example.com', role: '관리자', status: 'active', createdAt: '2026-01-10T09:00:00Z' },
  { id: '2', name: '김철수', email: 'kim@example.com', role: '편집자', status: 'pending', createdAt: '2026-02-05T11:30:00Z' },
  { id: '3', name: '이영희', email: 'lee@example.com', role: '뷰어', status: 'inactive', createdAt: '2026-03-20T14:00:00Z' },
  { id: '4', name: '박민준', email: 'park@example.com', role: '편집자', status: 'active', createdAt: '2026-03-25T08:00:00Z' },
  { id: '5', name: '최지은', email: 'choi@example.com', role: '뷰어', status: 'active', createdAt: '2026-04-01T10:00:00Z' },
]

export const handlers = [
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const limit = Number(url.searchParams.get('limit') ?? 100)
    const search = url.searchParams.get('search') ?? ''
    const sort = url.searchParams.get('sort') ?? ''
    const order = url.searchParams.get('order') ?? 'asc'

    let filtered = search
      ? mockUsers.filter(
          (u) =>
            u.name.includes(search) ||
            u.email.includes(search) ||
            u.role.includes(search),
        )
      : [...mockUsers]

    if (sort) {
      filtered.sort((a, b) => {
        const aVal = a[sort as keyof User] ?? ''
        const bVal = b[sort as keyof User] ?? ''
        const cmp = String(aVal).localeCompare(String(bVal))
        return order === 'desc' ? -cmp : cmp
      })
    }

    const total = filtered.length
    const rows = filtered.slice(page * limit, page * limit + limit)
    return HttpResponse.json({ rows, total })
  }),

  http.get('/api/vul-plans', () => HttpResponse.json(mockVulPlans)),

  http.get('/api/vul-plans/:id', ({ params }) => {
    const plan = mockVulPlans.find((p) => p.id === params.id)
    if (!plan) {
      return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    }
    return HttpResponse.json(plan)
  }),
]
