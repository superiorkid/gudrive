"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getFileIcon } from "@/lib/folder-icon"
import { formatBytes, formatDate } from "@/lib/utils"
import { TNode } from "@/types/node-type"
import { ColumnDef } from "@tanstack/react-table"
import {
  DownloadIcon,
  HardDriveIcon,
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "lucide-react"
import { useMemo } from "react"
import { useSoftDeleteNode } from "./apis/nodes/use-soft-delete-node"
import { useSortBy } from "./use-sort-by"

type TableVariant = "default" | "trash"

export const useNodeColumns = (variant: TableVariant = "default") => {
  const [sortBy] = useSortBy()

  return useMemo(() => {
    const baseColumns: ColumnDef<TNode>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const { name, type, mime_type } = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="size-5 shrink-0">
                {getFileIcon(type, mime_type || "")}
              </div>
              <span className="max-w-50 truncate font-medium">{name}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "mime_type",
        header: "File Type",
        cell: ({ row }) => <div>{row.original.mime_type ?? "-"}</div>,
      },
      {
        accessorKey: "size",
        header: "File Size",
        cell: ({ row }) => {
          const size = row.original.size
          return <div>{size ? formatBytes(size) : "-"}</div>
        },
      },
    ]

    const conditionalColumns: ColumnDef<TNode>[] = []

    if (variant === "trash") {
      conditionalColumns.push(
        {
          accessorKey: sortBy === "date-modified" ? "updated_at" : "deleted_at",
          header: sortBy === "date-modified" ? "Last Modified" : "Date Trashed",
          cell: ({ row }) => {
            const dateFilter =
              sortBy === "date-modified"
                ? row.original.updated_at
                : row.original.deleted_at
            return <div>{formatDate(dateFilter?.toString() || "")}</div>
          },
        },
        {
          accessorKey: "parent",
          header: "Original Location",
          cell: ({ row }) => (
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDriveIcon className="size-4" />
              <span>{row.original.parent?.name || "Root"}</span>
            </div>
          ),
        }
      )
    } else {
      conditionalColumns.push({
        accessorKey: "updated_at",
        header: "Last Modified",
        cell: ({ row }) => (
          <div>{formatDate(row.original.updated_at.toString())}</div>
        ),
      })
    }

    const actionColumn: ColumnDef<TNode> = {
      id: "actions",
      cell: ({ row }) => {
        const nodeId = row.original.id
        return <ActionRow nodeId={nodeId} variant={variant} />
      },
    }

    return [...baseColumns, ...conditionalColumns, actionColumn]
  }, [variant, sortBy])
}

function ActionRow({
  nodeId,
  variant,
}: {
  nodeId: string
  variant: TableVariant
}) {
  const { mutate: softDeleteMutation, isPending } = useSoftDeleteNode()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.stopPropagation()
        }
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0" disabled={isPending}>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {variant === "trash" ? (
            <>
              <DropdownMenuItem onClick={() => console.log("Restore", nodeId)}>
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
                disabled={isPending}
              >
                <TrashIcon className="mr-2 size-4" /> Move to Trash
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
