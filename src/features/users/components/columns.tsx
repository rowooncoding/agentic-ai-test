import { type ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { User } from '../types'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const STATUS_BADGE_MAP: Record<User['status'], { variant: BadgeVariant; label: string }> = {
  active: { variant: 'default', label: '활성' },
  pending: { variant: 'secondary', label: '대기' },
  inactive: { variant: 'outline', label: '비활성' },
}

export const userColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="전체 선택"
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="행 선택"
        />
      </div>
    ),
    enableSorting: false,
    enableResizing: false,
    size: 52,
  },
  {
    accessorKey: 'name',
    header: '이름',
    size: 150,
  },
  {
    accessorKey: 'email',
    header: '이메일',
    size: 220,
  },
  {
    accessorKey: 'role',
    header: '역할',
    size: 120,
  },
  {
    accessorKey: 'status',
    header: '상태',
    size: 100,
    cell: ({ row }) => {
      const { variant, label } = STATUS_BADGE_MAP[row.original.status]
      return <Badge variant={variant}>{label}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: '생성일',
    size: 120,
    cell: ({ row }) => dayjs(row.original.createdAt).format('YYYY-MM-DD'),
  },
  {
    id: 'actions',
    header: '',
    size: 80,
    enableSorting: false,
    enableResizing: false,
    cell: ({ row: _row }) => (
      <Button variant="ghost" size="sm">
        편집
      </Button>
    ),
  },
]
