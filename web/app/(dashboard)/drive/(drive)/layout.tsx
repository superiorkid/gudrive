import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchIcon } from "lucide-react"
import React, { Suspense } from "react"
import AppContext from "../../_components/app-context"
import AppBreadcrumb from "../_components/app-breadcrumb"
import NodeDisplaySwitcher from "../_components/node-display-switcher"
import NodeFilters from "../_components/node-filters"

type Props = {
  children: React.ReactNode
}

const DriveLayout = ({ children }: Props) => {
  return (
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
          <Suspense
            fallback={
              <div className="flex items-center space-x-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`skeleton-${index}`} className="h-10 w-40" />
                ))}
              </div>
            }
          >
            <NodeFilters />
          </Suspense>
          <AppContext>{children}</AppContext>
        </div>
      </div>
    </main>
  )
}

export default DriveLayout
