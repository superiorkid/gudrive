"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodes } from "@/hooks/apis/nodes/use-nodes"
import { Suspense } from "react"

type Props = {
  folderId: string
}

const DetailFolderPage = ({ folderId }: Props) => {
  const { data: nodes, isPending } = useNodes(folderId)

  if (isPending) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Suspense>
      <NodesDisplay data={nodes?.data ?? []} />
    </Suspense>
  )
}

export default DetailFolderPage
