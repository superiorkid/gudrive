"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodes } from "@/hooks/apis/nodes/use-nodes"
import { useType } from "@/hooks/use-type"

type Props = {
  folderId: string
}

const DetailFolderPage = ({ folderId }: Props) => {
  const [type] = useType()
  const { data: nodes, isPending } = useNodes({ parentId: folderId, type })

  if (isPending) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    )
  }

  return <NodesDisplay data={nodes?.data ?? []} />
}

export default DetailFolderPage
