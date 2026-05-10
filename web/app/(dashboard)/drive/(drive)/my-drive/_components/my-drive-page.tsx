"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodes } from "@/hooks/queries/nodes/use-nodes"
import { Suspense } from "react"

const MyDrivePage = () => {
  const { data: nodes, isPending } = useNodes()

  if (isPending) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Suspense>
      <NodesDisplay data={nodes?.data || []} />
    </Suspense>
  )
}

export default MyDrivePage
