"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodes } from "@/hooks/apis/nodes/use-nodes"
import { useModified } from "@/hooks/use-modified"
import { useNodeColumns } from "@/hooks/use-node-columns"
import { useSortBy } from "@/hooks/use-sort-by"
import { useSortDirection } from "@/hooks/use-sort-direction"
import { useType } from "@/hooks/use-type"
import { NodesSkeleton } from "../../../_components/node-skeleton"

const TrashPage = () => {
  const [type] = useType()
  const [modified] = useModified()
  const [sortDirection] = useSortDirection()
  const [sortBy] = useSortBy()

  const columns = useNodeColumns("trash")

  const { data: nodes, isPending } = useNodes({
    type,
    modified,
    sortBy,
    sortDirection,
    status: "trashed",
  })

  if (isPending) {
    return <NodesSkeleton rows={12} />
  }

  return <NodesDisplay data={nodes?.data || []} columns={columns} />
}

export default TrashPage
