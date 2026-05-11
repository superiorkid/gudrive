"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { Skeleton } from "@/components/ui/skeleton"
import { useNodes } from "@/hooks/apis/nodes/use-nodes"
import { useType } from "@/hooks/use-type"
import { Suspense } from "react"

const MyDrivePage = () => {
  const [type] = useType()
  const { data: nodes, isPending } = useNodes({ type })

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
