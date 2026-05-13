"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodes } from "@/hooks/apis/nodes/use-nodes"
import { useFoldersGroup } from "@/hooks/use-folders-group"
import { useModified } from "@/hooks/use-modified"
import { useNodeColumns } from "@/hooks/use-node-columns"
import { useSortBy } from "@/hooks/use-sort-by"
import { useSortDirection } from "@/hooks/use-sort-direction"
import { useType } from "@/hooks/use-type"
import { NodesSkeleton } from "../../../_components/node-skeleton"

const MyDrivePage = () => {
  const [type] = useType()
  const [modified] = useModified()
  const [folderGroup] = useFoldersGroup()
  const [sortDirection] = useSortDirection()
  const [sortBy] = useSortBy()

  const columns = useNodeColumns("default")

  const { data: nodes, isPending } = useNodes({
    type,
    modified,
    folderGroup,
    sortBy,
    sortDirection,
  })

  if (isPending) {
    return <NodesSkeleton rows={12} />
  }

  return <NodesDisplay data={nodes?.data || []} columns={columns} />
}

export default MyDrivePage
