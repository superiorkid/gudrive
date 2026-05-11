"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useNodes } from "@/hooks/apis/nodes/use-nodes"
import { useFoldersGroup } from "@/hooks/use-folders-group"
import { useModified } from "@/hooks/use-modified"
import { useSortBy } from "@/hooks/use-sort-by"
import { useSortDirection } from "@/hooks/use-sort-direction"
import { useType } from "@/hooks/use-type"

type Props = {
  folderId: string
}

const DetailFolderPage = ({ folderId }: Props) => {
  const [type] = useType()
  const [modified] = useModified()
  const [folderGroup] = useFoldersGroup()
  const [sortDirection] = useSortDirection()
  const [sortBy] = useSortBy()

  const { data: nodes, isPending } = useNodes({
    parentId: folderId,
    type,
    modified,
    folderGroup,
    sortBy,
    sortDirection,
  })

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
