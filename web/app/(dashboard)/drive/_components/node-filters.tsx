"use client"

import { useModified } from "@/hooks/use-modified"
import { useType } from "@/hooks/use-type"
import NodeModifiedFilter from "./node-modified-filter"
import NodeSortFilter from "./node-sort-filter"
import NodeTypeFilter from "./node-type-filter"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const NodeFilters = () => {
  const [type, setType] = useType()
  const [modified, setModified] = useModified()

  const clearAllFilter = () => {
    if (type) {
      setType(null)
    }

    if (modified) {
      setModified(null)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Suspense
        fallback={
          <div className="flex items-center space-x-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`skeleton-${index}`} className="h-10 w-40" />
            ))}
          </div>
        }
      >
        <NodeTypeFilter />
        <NodeModifiedFilter />
        <NodeSortFilter />
      </Suspense>
    </div>
  )
}

export default NodeFilters
