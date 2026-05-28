"use client"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCopyNode } from "@/hooks/apis/nodes/use-copy-node"
import { useCutNode } from "@/hooks/apis/nodes/use-cut-node"
import { useClipboard } from "@/providers/clipboard-provider"
import { useNodeSelection } from "@/providers/node-selection-provider"
import { ClipboardPasteIcon, FilePlusIcon, FolderPlusIcon } from "lucide-react"
import { useParams } from "next/navigation"
import React, { useState } from "react"
import CreateFolderForm from "./create-folder-form"
import FileUploads from "./file-uploads"

type Props = {
  children: React.ReactNode
}

// multipe dialogs in context menu
//
// ref: https://github.com/shadcn-ui/ui/issues/1011#issuecomment-1930103090

enum Dialogs {
  createFolderDialog = "createFolderDialog",
  uploadFileDialog = "uploadFileDialog",
}

const AppContext = ({ children }: Props) => {
  const [dialog, setDialog] = useState<Dialogs | null>(null)
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const { folderId } = useParams<{ folderId: string }>()

  const { clipboardNodeIds, operation, hasItems, clearClipboard } =
    useClipboard()

  const { clearSelection, selectedNodeIds } = useNodeSelection()

  const { mutate: cutNodeMutation, isPending: cutNodePending } = useCutNode({
    onSuccess: () => {
      clearClipboard()
      clearSelection()
    },
  })
  const { mutate: copyNodeMutation, isPending: copyNodePending } = useCopyNode({
    onSuccess: () => {
      clearClipboard()
      clearSelection()
    },
  })

  const handlePaste = (params: { newParentId?: string }) => {
    if (!hasItems) return

    if (operation == "cut") {
      cutNodeMutation({
        nodeIds: clipboardNodeIds || selectedNodeIds,
        parentId: params.newParentId,
      })
    }

    if (operation === "copy") {
      copyNodeMutation({
        nodeIds: clipboardNodeIds || selectedNodeIds,
        parentId: params.newParentId,
      })
    }
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <ContextMenu>
        <ContextMenuTrigger>
          <FileUploads>{children}</FileUploads>
        </ContextMenuTrigger>
        <ContextMenuContent className="z-40">
          <ContextMenuItem
            disabled={
              !hasItems || cutNodePending || copyNodePending || !selectedNodeIds
            }
            onClick={() => {
              handlePaste({ newParentId: folderId })
            }}
          >
            <ClipboardPasteIcon className="mr-2 size-4" />
            Paste
          </ContextMenuItem>
          <DialogTrigger
            asChild
            onClick={() => setDialog(Dialogs.createFolderDialog)}
          >
            <ContextMenuItem>
              <FolderPlusIcon className="mr-2" />
              New Folder
            </ContextMenuItem>
          </DialogTrigger>
          <DialogTrigger
            asChild
            onClick={() => setDialog(Dialogs.uploadFileDialog)}
          >
            <ContextMenuItem>
              <FilePlusIcon className="mr-2" />
              Upload Files
            </ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>
      <DialogContent>
        {dialog === Dialogs.createFolderDialog ? (
          <>
            <DialogHeader>
              <DialogTitle>New Folder</DialogTitle>
            </DialogHeader>
            <div>
              <CreateFolderForm
                onSuccess={() => {
                  setOpenDialog(false)
                }}
              />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <div>dialog 2 example</div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AppContext
