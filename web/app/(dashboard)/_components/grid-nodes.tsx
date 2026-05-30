"use client"

import { useDisplay } from "@/hooks/use-display"
import { useFoldersGroup } from "@/hooks/use-folders-group"
import { TNode } from "@/types/node-type"
import { usePathname, useRouter } from "next/navigation"
import NoItemsView from "./no-items-view"
import NodeCard from "./node-card"

type Props = {
  data: Array<TNode>
}

const GridNodes = ({ data }: Props) => {
  const { push } = useRouter()

  const [display] = useDisplay()
  const searchParams = new URLSearchParams({ display })

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

  const handleNodeNavigation = (node: TNode) => {
    if (node.type === "folder") {
      push(`/drive/folders/${node.id}?${searchParams.toString()}`)
    }

    if (node.type === "file") {
      const rawFileUrl = `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/nodes/${node.id}/raw`

      const officeMimeTypes = [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        "application/wps-office.docx",
        "application/wps-office.xlsx",
        "application/wps-office.pptx",
        "application/wps-office.doc",
        "application/wps-office.xls",
        "application/wps-office.ppt",
      ]

      const isOfficeDoc = officeMimeTypes.includes(node.mime_type || "")

      let finalUrl = rawFileUrl

      if (isOfficeDoc) {
        finalUrl = `https://docs.google.com/gview?url=${encodeURIComponent(rawFileUrl)}&embedded=true`
      }

      window.open(finalUrl, "_blank", "noopener,noreferrer")
    }
  }

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
            handleNavigation={handleNodeNavigation}
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
