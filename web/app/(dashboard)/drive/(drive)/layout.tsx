import { Skeleton } from "@/components/ui/skeleton"
import React, { Suspense } from "react"
import AppActions from "../_components/app-actions"
import AppBreadcrumb from "../_components/app-breadcrumb"
import AppSearch from "../_components/app-search"
import NodeDisplaySwitcher from "../_components/node-display-switcher"

type Props = {
  children: React.ReactNode
}

const DriveLayout = ({ children }: Props) => {
  return (
    <main className="grid min-h-screen w-full grid-rows-[auto_1fr]">
      <div className="px-8 py-4">
        <Suspense
          fallback={<Skeleton className="h-10 max-w-md 2xl:max-w-xl" />}
        >
          <AppSearch />
        </Suspense>
      </div>
      <div className="space-y-4 px-8 pt-4 pb-8">
        <div className="flex items-center justify-between">
          <Suspense
            fallback={
              <div className="flex items-center space-x-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`skeleton-${index}`} className="h-10 w-40" />
                ))}
              </div>
            }
          >
            <AppBreadcrumb />
          </Suspense>

          <Suspense fallback={<div>Loading...</div>}>
            <NodeDisplaySwitcher />
          </Suspense>
        </div>

        <div className="space-y-3">
          <AppActions />
          {children}
        </div>
      </div>
    </main>
  )
}

export default DriveLayout
