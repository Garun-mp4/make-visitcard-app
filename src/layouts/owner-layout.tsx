import { Outlet } from 'react-router-dom'

import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { DesktopSidebar } from '@/components/layout/desktop-sidebar'

export function OwnerLayout() {
  return (
    <div className="app-shell">
      <DesktopSidebar />
      <div className="lg:pl-[220px]">
        <Outlet />
      </div>
      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  )
}
