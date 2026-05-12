"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodeColumns } from "@/hooks/use-node-columns"

const SearchPage = () => {
  const columns = useNodeColumns("default")
  return <NodesDisplay data={[]} columns={columns} />
}

export default SearchPage
