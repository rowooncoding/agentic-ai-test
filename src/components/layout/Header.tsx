import { useLocation } from 'react-router-dom'
import { Bell, CircleUserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PAGE_TITLE_MAP: Record<string, string> = {
  '/': '사용자 관리',
  '/vul-plans': '취약점 계획',
}

function Header() {
  const { pathname } = useLocation()
  const title = PAGE_TITLE_MAP[pathname] ?? ''

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      {/* 페이지 타이틀 */}
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      {/* 우측 영역 */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="sr-only">알림</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <CircleUserRound className="h-4 w-4" />
          <span className="sr-only">내 계정</span>
        </Button>
      </div>
    </header>
  )
}

export { Header }
