"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useRestoreNode } from "@/hooks/apis/nodes/use-restore-node"
import { useSoftDeleteNode } from "@/hooks/apis/nodes/use-soft-delete-node"
import { useDisplay } from "@/hooks/use-display"
import { getFileIcon } from "@/lib/folder-icon"
import { TNode } from "@/types/node-type"
import { FolderIcon, MoreHorizontalIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import NodeActionDropdown from "./node-action-dropdown"

type Props = {
  node: TNode
  shouldRenderCard: boolean
  isTrashPage: boolean
  isFile: boolean
  isFolder: boolean
  isMixedView: boolean
}

const NodeCard = ({
  node,
  shouldRenderCard,
  isTrashPage,
  isFile,
  isFolder,
  isMixedView,
}: Props) => {
  const { push } = useRouter()
  const [display] = useDisplay()

  const { mutate: softDeleteMutation, isPending: pendingSoftDelete } =
    useSoftDeleteNode()
  const { mutate: restoreNodeMutation, isPending: restoreNodePending } =
    useRestoreNode()

  const handleNodeNavigation = (node: TNode) => {
    if (node.type === "folder") {
      push(`/drive/folders/${node.id}?display=${display}`)
    } else {
      console.log("Opening file preview for:", node.name)
    }
  }

  return (
    <div onDoubleClick={() => handleNodeNavigation(node)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0">
              {getFileIcon(node.type, node.mime_type || "")}
            </div>

            <span className="line-clamp-1 min-w-0 flex-1">{node.name}</span>
          </div>

          <div className="shrink-0">
            <NodeActionDropdown
              nodeId={node.id}
              isTrashPage={isTrashPage}
              restoreNodeMutation={restoreNodeMutation}
              restoreNodePending={restoreNodePending}
              softDeleteMutation={softDeleteMutation}
              softDeleteNodePending={pendingSoftDelete}
            >
              <Button
                variant="ghost"
                className="size-8 p-0"
                disabled={pendingSoftDelete || restoreNodePending}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </NodeActionDropdown>
          </div>
        </CardHeader>

        {shouldRenderCard && (
          <CardContent>
            {((isFolder && isMixedView) || (isFolder && isTrashPage)) && (
              <div className="flex aspect-square items-center justify-center">
                <FolderIcon size={65} className="fill-sky-600 stroke-sky-600" />
              </div>
            )}

            {isFile && (
              <div className="relative aspect-square">
                <Image
                  fill
                  src="https://images.unsplash.com/photo-1566396223585-c8fbf7fa6b6d?q=80&w=1549&auto=format&fit=crop&ixlib=rb-4.1.0"
                  alt={`image preview ${node.name}`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  quality={80}
                  decoding="async"
                  loading="lazy"
                />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default NodeCard
