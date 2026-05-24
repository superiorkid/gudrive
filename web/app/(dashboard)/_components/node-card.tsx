"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useForceDeleteNode } from "@/hooks/apis/nodes/use-force-delete-node"
import { useRestoreNode } from "@/hooks/apis/nodes/use-restore-node"
import { useSoftDeleteNode } from "@/hooks/apis/nodes/use-soft-delete-node"
import { useToggleStar } from "@/hooks/apis/nodes/use-toggle-star"
import { useDisplay } from "@/hooks/use-display"
import { getFileIcon } from "@/lib/folder-icon"
import { cn } from "@/lib/utils"
import { TNode } from "@/types/node-type"
import {
  ClockIcon,
  FolderIcon,
  ImageOffIcon,
  Loader2Icon,
  MoreHorizontalIcon,
} from "lucide-react"
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
  isStarred: boolean
}

const NodeCard = ({
  node,
  shouldRenderCard,
  isTrashPage,
  isFile,
  isFolder,
  isMixedView,
  isStarred,
}: Props) => {
  const { push } = useRouter()
  const [display] = useDisplay()
  const searchParams = new URLSearchParams({ display })

  const { mutate: softDeleteMutation, isPending: pendingSoftDelete } =
    useSoftDeleteNode()
  const { mutate: restoreNodeMutation, isPending: restoreNodePending } =
    useRestoreNode()
  const { mutate: forceDeleteMutation, isPending: forceDeletePending } =
    useForceDeleteNode()

  const { mutate: toggleStarMutation, isPending: toggleStarPending } =
    useToggleStar(isStarred)

  const handleNodeNavigation = (node: TNode) => {
    if (node.type === "folder") {
      push(`/drive/folders/${node.id}?${searchParams.toString()}`)
    } else {
      console.log("Opening file preview for:", node.name)
    }
  }

  return (
    <div
      onDoubleClick={() => handleNodeNavigation(node)}
      className={cn(
        node.type === "folder" ? "cursor-pointer" : "cursor-default"
      )}
    >
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
              isStarred={isStarred}
              toggleStarMutation={toggleStarMutation}
              toggleStarPending={toggleStarPending}
              forceDeleteMutation={forceDeleteMutation}
              forceDeleteNodePending={forceDeletePending}
              nodeType={node.type}
            >
              <Button
                variant="ghost"
                className="size-8 p-0"
                disabled={
                  pendingSoftDelete || restoreNodePending || forceDeletePending
                }
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
              <div className="relative aspect-square overflow-hidden rounded-md">
                {node.preview_status === "ready" && node.preview_url ? (
                  <Image
                    fill
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${node.preview_url}`}
                    alt={`image preview ${node.name}`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    quality={80}
                    decoding="async"
                    loading="eager"
                  />
                ) : node.preview_status === "processing" ? (
                  <div className="flex h-full w-full animate-pulse items-center justify-center bg-muted">
                    <Loader2Icon className="animate-spin text-muted-foreground" />
                  </div>
                ) : node.preview_status === "pending" ? (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <ClockIcon className="text-muted-foreground" />
                  </div>
                ) : node.preview_status === "failed" ? (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <ImageOffIcon className="text-red-500" />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <ImageOffIcon />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default NodeCard
