"use client"

import {
  Dialog,
  DialogContent,
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
import { DownloadIcon, PencilIcon, StarIcon, TrashIcon } from "lucide-react"
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
}: Props) => {
  const [openDialog, setOpenDialog] = useState<boolean>(false)

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-44">
          {isTrashPage ? (
            <>
              <DropdownMenuItem
                onClick={() => restoreNodeMutation(nodeId)}
                disabled={restoreNodePending}
              >
                Restore Item
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete Permanently
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem>
                <DownloadIcon className="mr-2 size-4" /> Download
              </DropdownMenuItem>
              <DialogTrigger asChild>
                <DropdownMenuItem>
                  <PencilIcon className="mr-2 size-4" /> Rename
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toggleStarMutation(nodeId)}
                disabled={toggleStarPending}
              >
                {isStarred ? (
                  <>
                    <StarIcon className="mr-2 size-4 fill-foreground" /> Remove
                    from Starred
                  </>
                ) : (
                  <>
                    <StarIcon className="mr-2 size-4" /> Add to Starred
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => softDeleteMutation(nodeId)}
                disabled={softDeleteNodePending}
              >
                <TrashIcon className="mr-2 size-4" /> Move to Trash
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <RenameNodeForm
          nodeId={nodeId}
          onUpdateSuccess={() => {
            setOpenDialog(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export default NodeActionDropdown
