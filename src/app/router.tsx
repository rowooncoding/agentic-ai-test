import { createBrowserRouter } from 'react-router-dom'
import { UsersPage } from '@/features/users/components/UsersPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <UsersPage />,
  },
])
