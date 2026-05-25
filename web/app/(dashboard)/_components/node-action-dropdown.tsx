"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCopyNode } from "@/hooks/apis/nodes/use-copy-node"
import { useCutNode } from "@/hooks/apis/nodes/use-cut-node"
import { useClipboard } from "@/providers/clipboard-provider"
import { useNodeSelection } from "@/providers/node-selection-provider"
import {
  ClipboardPasteIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  ScissorsIcon,
  StarIcon,
  TimerResetIcon,
  TrashIcon,
  XCircleIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"
import React, { useState } from "react"
import RenameNodeForm from "./rename-node-form"

type Props = {
  children: React.ReactNode
  nodeId: string
  isTrashPage: boolean
  restoreNodePending: boolean
  restoreNodeMutation: (nodeId: string) => void
  softDeleteNodePending: boolean
  softDeleteMutation: (nodeId: string) => void
  isStarred: boolean
  toggleStarPending: boolean
  toggleStarMutation: (nodeId: string) => void
  forceDeleteNodePending: boolean
  forceDeleteMutation: (nodeId: string) => void
  nodeType: "folder" | "file"
}

enum Dialogs {
  renameDialog = "renameDialog",
  forceDeleteDialog = "forceDeleteDialog",
}

const NodeActionDropdown = ({
  children,
  isTrashPage,
  nodeId,
  restoreNodeMutation,
  restoreNodePending,
  softDeleteMutation,
  softDeleteNodePending,
  isStarred,
  toggleStarMutation,
  toggleStarPending,
  forceDeleteMutation,
  forceDeleteNodePending,
  nodeType,
}: Props) => {
  const [dialog, setDialog] = useState<Dialogs | null>(null)
  const [openDropdown, setOpenDropdown] = useState(false)

  const pathname = usePathname()

  const displayMoveNodeMenu =
    pathname.includes("my-drive") || pathname.includes("folders")

  const { selectedNodeIds, selectSingleNode } = useNodeSelection()

  const {
    clipboardNodeIds,
    operation,
    hasItems,
    cutNodes,
    copyNodes,
    clearClipboard,
  } = useClipboard()

  const activeNodeIds =
    selectedNodeIds.length > 0 && selectedNodeIds.includes(nodeId)
      ? selectedNodeIds
      : [nodeId]

  const { mutate: cutNodeMutation, isPending: cutNodePending } = useCutNode({
    onSuccess: () => {
      clearClipboard()
    },
  })

  const { mutate: copyNodeMutation, isPending: copyNodePending } = useCopyNode({
    onSuccess: () => {
      clearClipboard()
    },
  })

  const handlePaste = (params: { newParentId?: string }) => {
    if (!hasItems) return

    if (operation === "cut") {
      cutNodeMutation({
        nodeIds: clipboardNodeIds,
        parentId: params.newParentId,
      })
    }

    if (operation === "copy") {
      copyNodeMutation({
        nodeIds: clipboardNodeIds,
        parentId: params.newParentId,
      })
    }
  }

  return (
    <Dialog
      open={!!dialog}
      onOpenChange={(open) => {
        if (!open) {
          setDialog(null)
        }
      }}
    >
      <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
        <DropdownMenuTrigger asChild>
          <div
            onClick={(event) => {
              event.stopPropagation()

              if (!selectedNodeIds.includes(nodeId)) {
                selectSingleNode(nodeId)
              }
            }}
          >
            {children}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-44">
          {isTrashPage ? (
            <>
              <DropdownMenuItem
                disabled={restoreNodePending}
                onSelect={(e) => {
                  e.preventDefault()
                  restoreNodeMutation(nodeId)
                }}
              >
                <TimerResetIcon className="mr-2 size-4" />
                Restore Item
              </DropdownMenuItem>

              <DialogTrigger asChild>
                <DropdownMenuItem
                  className="text-destructive hover:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault()
                    setDialog(Dialogs.forceDeleteDialog)
                  }}
                >
                  <XCircleIcon className="mr-2 size-4" />
                  Delete Forever
                </DropdownMenuItem>
              </DialogTrigger>
            </>
          ) : (
            <>
              <DropdownMenuItem>
                <DownloadIcon className="mr-2 size-4" />
                Download
              </DropdownMenuItem>

              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setDialog(Dialogs.renameDialog)
                  }}
                >
                  <PencilIcon className="mr-2 size-4" />
                  Rename
                </DropdownMenuItem>
              </DialogTrigger>

              <DropdownMenuItem
                disabled={toggleStarPending}
                onSelect={(e) => {
                  e.preventDefault()
                  toggleStarMutation(nodeId)
                }}
              >
                {isStarred ? (
                  <>
                    <StarIcon className="mr-2 size-4 fill-foreground" />
                    Remove from Starred
                  </>
                ) : (
                  <>
                    <StarIcon className="mr-2 size-4" />
                    Add to Starred
                  </>
                )}
              </DropdownMenuItem>

              {displayMoveNodeMenu && (
                <>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    disabled={cutNodePending}
                    onSelect={(e) => {
                      e.preventDefault()
                      cutNodes(activeNodeIds)
                      setOpenDropdown(false)
                    }}
                  >
                    <ScissorsIcon className="mr-2 size-4" />
                    Cut
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled={copyNodePending}
                    onSelect={(e) => {
                      e.preventDefault()
                      copyNodes(activeNodeIds)
                      setOpenDropdown(false)
                    }}
                  >
                    <CopyIcon className="mr-2 size-4" />
                    Copy
                  </DropdownMenuItem>

                  {nodeType === "folder" && (
                    <DropdownMenuItem
                      disabled={!hasItems}
                      onSelect={(e) => {
                        e.preventDefault()

                        handlePaste({
                          newParentId: nodeId,
                        })
                      }}
                    >
                      <ClipboardPasteIcon className="mr-2 size-4" />
                      Paste Into Folder
                    </DropdownMenuItem>
                  )}
                </>
              )}

              <DropdownMenuItem
                className="text-destructive hover:text-destructive"
                disabled={softDeleteNodePending}
                onSelect={(e) => {
                  e.preventDefault()
                  softDeleteMutation(nodeId)
                }}
              >
                <TrashIcon className="mr-2 size-4" />
                Move to Trash
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        {dialog === Dialogs.renameDialog ? (
          <>
            <DialogHeader>
              <DialogTitle>Rename</DialogTitle>
            </DialogHeader>

            <RenameNodeForm
              nodeId={nodeId}
              onUpdateSuccess={() => {
                setDialog(null)
                setOpenDropdown(false)
              }}
            />
          </>
        ) : dialog === Dialogs.forceDeleteDialog ? (
          <>
            <DialogHeader>
              <DialogTitle>Delete Forever?</DialogTitle>

              <DialogDescription>
                This File/Folder will be deleted forever. This cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>

              <Button
                type="button"
                variant="destructive"
                disabled={forceDeleteNodePending}
                onClick={() => forceDeleteMutation(nodeId)}
              >
                Delete Forever
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default NodeActionDropdown
