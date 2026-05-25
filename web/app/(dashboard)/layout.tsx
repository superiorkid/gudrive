import { SidebarProvider } from "@/components/ui/sidebar"
import { getQueryClient } from "@/lib/query-client"
import { authKeys } from "@/lib/query-keys"
import { ClipboardProvider } from "@/providers/clipboard-provider"
import { NodeSelectionProvider } from "@/providers/node-selection-provider"
import { getSession } from "@/services/auth-service"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import React, { Suspense } from "react"
import { AppSidebar } from "./_components/app-sidebar"

type Props = {
  children: React.ReactNode
}

const DashboardLayout = async ({ children }: Props) => {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: authKeys.session(),
    queryFn: getSession,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <NodeSelectionProvider>
          <ClipboardProvider>
            <Suspense>
              <AppSidebar />
            </Suspense>

            {children}
          </ClipboardProvider>
        </NodeSelectionProvider>
      </SidebarProvider>
    </HydrationBoundary>
  )
}

export default DashboardLayout
