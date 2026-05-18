"use client"

import { useFoldersGroup } from "@/hooks/use-folders-group"
import { TNode } from "@/types/node-type"
import { usePathname } from "next/navigation"
import NoItemsView from "./no-items-view"
import NodeCard from "./node-card"

type Props = {
  data: Array<TNode>
}

const GridNodes = ({ data }: Props) => {
  const [folderGroup] = useFoldersGroup()

  const pathname = usePathname()
  const isTrashPage = pathname.includes("trash")

  if (!data.length) {
    return <NoItemsView />
  }

  const folders =
    folderGroup === "top" && !isTrashPage
      ? data.filter((n) => n.type === "folder")
      : data

  const files =
    folderGroup === "top" && !isTrashPage
      ? data.filter((n) => n.type !== "folder")
      : []

  const renderGrid = (nodes: TNode[]) => (
    <div className="grid grid-cols-4 gap-4 2xl:grid-cols-7">
      {nodes.map((node) => {
        const isFile = node.type === "file"
        const isFolder = node.type === "folder"
        const isMixedView = folderGroup === "mixed"
        const shouldRenderCard =
          isFile || (isMixedView && isFolder) || isTrashPage

        return (
          <NodeCard
            key={`node-${node.id}`}
            node={node}
            shouldRenderCard={shouldRenderCard}
            isFolder={isFolder}
            isFile={isFile}
            isMixedView={isMixedView}
            isTrashPage={isTrashPage}
            isStarred={node.is_starred}
          />
        )
      })}
    </div>
  )

  return (
    <div className="mt-4">
      {folderGroup === "top" ? (
        <div className="space-y-8">
          {folders.length > 0 && renderGrid(folders)}
          {files.length > 0 && renderGrid(files)}
        </div>
      ) : (
        renderGrid(data)
      )}
    </div>
  )
}

export default GridNodes
