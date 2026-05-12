"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodeColumns } from "@/hooks/use-node-columns"

const TrashPage = () => {
  const columns = useNodeColumns("trash")
  return <NodesDisplay data={[]} columns={columns} />
}

export default TrashPage
