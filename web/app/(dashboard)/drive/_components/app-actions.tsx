"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useNodeSelection } from "@/providers/node-selection-provider"
import { Suspense } from "react"
import NodeFilters from "./node-filters"

const AppActions = () => {
  const { selectedNodeIds } = useNodeSelection()
  const hasSelectedItems = selectedNodeIds.length > 0

  if (hasSelectedItems) {
    return <div>action buttons list</div>
  }

  return (
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
  )
}

export default AppActions
