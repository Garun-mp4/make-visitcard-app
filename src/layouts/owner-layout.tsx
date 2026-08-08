import { Outlet, useLocation } from 'react-router-dom'

import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { DesktopSidebar } from '@/components/layout/desktop-sidebar'

export function OwnerLayout() {
  const location = useLocation()
  const editorDetail = location.pathname.startsWith('/app/editor/')
  return (
    <div className="app-shell">
      <DesktopSidebar />
      <div className="lg:pl-[220px]">
        <Outlet />
      </div>
      <div className={editorDetail ? 'hidden' : 'lg:hidden'}>
        <BottomNavigation />
      </div>
    </div>
  )
}
