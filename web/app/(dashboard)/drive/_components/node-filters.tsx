"use client"

import { usePathname } from "next/navigation"
import NodeModifiedFilter from "./node-modified-filter"
import NodeSortFilter from "./node-sort-filter"
import NodeTypeFilter from "./node-type-filter"

const NodeFilters = () => {
  const pathname = usePathname()

  return (
    <div className="flex items-center space-x-2">
      <NodeTypeFilter />
      <NodeModifiedFilter />
      <NodeSortFilter
        variant={pathname.includes("trash") ? "trash" : "default"}
      />
    </div>
  )
}

export default NodeFilters
