import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"
import NodeModifiedFilter from "./node-modified-filter"
import NodeSortFilter from "./node-sort-filter"
import NodeTypeFilter from "./node-type-filter"

const NodeFilters = () => {
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
      <div className="flex items-center space-x-2">
        <NodeTypeFilter />
        <NodeModifiedFilter />
        <NodeSortFilter />
      </div>
    </Suspense>
  )
}

export default NodeFilters
