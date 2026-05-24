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
import { useMoveNode } from "@/providers/move-node-provider"
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
  const [openDropdown, setOpenDropdown] = useState<boolean>(false)

  const pathname = usePathname()
  const displayMoveNodeMenu =
    pathname.includes("my-drive") || pathname.includes("folders")

  const { nodeIds, hasItems, setCutNodes, setCopyNodes, clearClipboard } =
    useMoveNode()

  // const { mutate: renameNodeMutation, isPending: renameNodePending } =
  //   useRenameNode({
  //     nodeId: nodeIds.at(0) || "",
  //     onSuccess: () => {
  //       setOpenDropdown(false)
  //     },
  //   })

  const handlePaste = (newParentId?: string) => {
    if (!hasItems) return
    // moveNodeMutaion({ parentId: newParentId })
  }

  return (
    <Dialog open={!!dialog}>
      <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
        <DropdownMenuTrigger>{children}</DropdownMenuTrigger>

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
                  onSelect={(e) => {
                    e.preventDefault()
                    setDialog(Dialogs.forceDeleteDialog)
                  }}
                  className="text-destructive hover:text-destructive"
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
                onSelect={(e) => {
                  e.preventDefault()
                  toggleStarMutation(nodeId)
                }}
                disabled={toggleStarPending}
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
                    onSelect={(e) => {
                      e.preventDefault()
                      setCutNodes([nodeId])
                      setOpenDropdown(false)
                    }}
                  >
                    <ScissorsIcon className="mr-2 size-4" />
                    Cut
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setCopyNodes([nodeId])
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
                        handlePaste(nodeId)
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
          <RenameNodeForm
            nodeId={nodeId}
            onUpdateSuccess={() => {
              setDialog(null)
              setOpenDropdown(false)
            }}
          />
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
                onClick={() => forceDeleteMutation(nodeId)}
                disabled={forceDeleteNodePending}
              >
                Delete Forever
              </Button>
            </DialogFooter>
          </>
        ) : undefined}
      </DialogContent>
    </Dialog>
  )
}

export default NodeActionDropdown
