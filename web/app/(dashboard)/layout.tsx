import { SidebarProvider } from "@/components/ui/sidebar"
import React, { Suspense } from "react"
import { AppSidebar } from "./_components/app-sidebar"

type Props = {
  children: React.ReactNode
}

const DashboardLayout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <Suspense>
        <AppSidebar />
      </Suspense>
      {children}
    </SidebarProvider>
  )
}

export default DashboardLayout
