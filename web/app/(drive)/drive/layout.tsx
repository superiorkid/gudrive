import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchIcon } from "lucide-react"
import React, { Suspense } from "react"
import { AppSidebar } from "../_components/app-sidebar"
import AppBreadcrumb from "./_components/app-breadcrumb"
import NodeDisplaySwitcher from "./_components/node-display-switcher"
import NodeSortFilter from "./_components/node-sort-filter"
import NodeTypeFilter from "./_components/node-type-filter"
import AppContext from "../_components/app-context"

type Props = {
  children: React.ReactNode
}

const DriveLayout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="grid min-h-screen w-full grid-rows-[auto_1fr]">
        <div className="px-8 py-4">
          <InputGroup className="h-10 max-w-md 2xl:max-w-xl">
            <InputGroupInput placeholder="Search in Drive" />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="space-y-4 px-8 pt-4 pb-8">
          <div className="flex items-center justify-between">
            <AppBreadcrumb
              data={[
                { label: "Home", href: "/" },
                { label: "Components", href: "/components" },
                { label: "My Drive" },
              ]}
            />

            <Suspense fallback={<div>Loading...</div>}>
              <NodeDisplaySwitcher />
            </Suspense>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Suspense fallback={<Skeleton />}>
                <NodeTypeFilter />
              </Suspense>
              <Suspense fallback={<Skeleton />}>
                <NodeSortFilter />
              </Suspense>
            </div>
            <AppContext>{children}</AppContext>
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}

export default DriveLayout
