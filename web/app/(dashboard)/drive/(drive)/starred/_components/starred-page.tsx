"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodeColumns } from "@/hooks/use-node-columns"

const StarredPage = () => {
  const columns = useNodeColumns()
  return <NodesDisplay data={[]} columns={columns} />
}

export default StarredPage
