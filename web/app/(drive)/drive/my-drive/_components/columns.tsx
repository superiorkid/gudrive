"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getFileIcon } from "@/lib/folder-icon"
import { formatBytes, formatDate } from "@/lib/utils"
import { TNode } from "@/types/node-type"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon } from "lucide-react"

export const columns: ColumnDef<TNode>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const { name, type, mime_type } = row.original

      return (
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 shrink-0">
            {getFileIcon(type, mime_type || "")}
          </div>
          <span className="max-w-50 truncate font-medium">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "updated_at",
    header: "Last Modified",
    cell: ({ row }) => {
      const modifiedAt = row.original.updated_at.toString()
      return <div>{formatDate(modifiedAt)}</div>
    },
  },
  {
    accessorKey: "mime_type",
    header: "File Type",
    cell: ({ row }) => {
      const mimeType = row.original.mime_type
      return <div>{mimeType ?? "-"}</div>
    },
  },
  {
    accessorKey: "size",
    header: "File Size",
    cell: ({ row }) => {
      const size = row.original.size
      return <div>{!!size ? formatBytes(size) : "-"}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-2 w-2 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
