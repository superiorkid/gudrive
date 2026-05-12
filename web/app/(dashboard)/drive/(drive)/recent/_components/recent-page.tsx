"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodeColumns } from "@/hooks/use-node-columns"

const RecentPage = () => {
  const columns = useNodeColumns("default")

  return <NodesDisplay data={[]} columns={columns} />
}

export default RecentPage
