import { SidebarProvider } from "@/components/ui/sidebar"
import React from "react"
import { AppSidebar } from "./_components/app-sidebar"

type Props = {
  children: React.ReactNode
}

const DashboardLayout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      {children}
    </SidebarProvider>
  )
}

export default DashboardLayout
