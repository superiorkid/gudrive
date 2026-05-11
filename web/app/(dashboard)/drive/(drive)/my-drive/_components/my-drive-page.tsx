"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodes } from "@/hooks/apis/nodes/use-nodes"
import { useModified } from "@/hooks/use-modified"
import { useType } from "@/hooks/use-type"

const MyDrivePage = () => {
  const [type] = useType()
  const [modified] = useModified()
  const { data: nodes, isPending } = useNodes({ type, modified })

  if (isPending) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    )
  }

  return <NodesDisplay data={nodes?.data || []} />
}

export default MyDrivePage
