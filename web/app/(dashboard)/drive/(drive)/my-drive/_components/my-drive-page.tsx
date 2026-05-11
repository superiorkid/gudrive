"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { Skeleton } from "@/components/ui/skeleton"
import { useNodes } from "@/hooks/apis/nodes/use-nodes"
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
    <Suspense fallback={<Skeleton className="h-8 w-36" />}>
      <NodesDisplay data={nodes?.data || []} />
    </Suspense>
  )
}

export default MyDrivePage
