"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DownloadIcon, PencilIcon, StarIcon, TrashIcon } from "lucide-react"
import React from "react"

type Props = {
  children: React.ReactNode
  nodeId: string
  isTrashPage: boolean
  restoreNodePending: boolean
  restoreNodeMutation: (nodeId: string) => void
  softDeleteNodePending: boolean
  softDeleteMutation: (nodeId: string) => void
}

const NodeActionDropdown = ({
  children,
  isTrashPage,
  nodeId,
  restoreNodeMutation,
  restoreNodePending,
  softDeleteMutation,
  softDeleteNodePending,
}: Props) => {
  return (
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
            <DropdownMenuItem>
              <PencilIcon className="mr-2 size-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <StarIcon className="mr-2 size-4" /> Add to Starred
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
  )
}

export default NodeActionDropdown
