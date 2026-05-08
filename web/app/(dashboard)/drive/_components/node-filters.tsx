"use client"

import { Button } from "@/components/ui/button"
import { useModified } from "@/hooks/use-modified"
import { useType } from "@/hooks/use-type"
import { XIcon } from "lucide-react"
import NodeModifiedFilter from "./node-modified-filter"
import NodeSortFilter from "./node-sort-filter"
import NodeTypeFilter from "./node-type-filter"

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
      <NodeTypeFilter />
      <NodeModifiedFilter />
      <NodeSortFilter />

      {(!!modified || !!type) && (
        <Button
          variant="destructive"
          size="lg"
          className="text-muted-foreground hover:text-destructive"
          onClick={clearAllFilter}
        >
          <XIcon className="mr-1" />
          Clear all filters
        </Button>
      )}
    </div>
  )
}

export default NodeFilters
