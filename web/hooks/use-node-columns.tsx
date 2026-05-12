"use client"

import NodeActionDropdown from "@/app/(dashboard)/_components/node-action-dropdown"
import { Button } from "@/components/ui/button"
import { getFileIcon } from "@/lib/folder-icon"
import { formatBytes, formatDate } from "@/lib/utils"
import { TNode } from "@/types/node-type"
import { ColumnDef } from "@tanstack/react-table"
import { HardDriveIcon, MoreHorizontalIcon } from "lucide-react"
import { useMemo } from "react"
import { useRestoreNode } from "./apis/nodes/use-restore-node"
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
  const { mutate: softDeleteMutation, isPending: pendingSoftDelete } =
    useSoftDeleteNode()
  const { mutate: restoreNodeMutation, isPending: restoreNodePending } =
    useRestoreNode()

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
      <NodeActionDropdown
        nodeId={nodeId}
        isTrashPage={variant === "trash"}
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
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </NodeActionDropdown>
    </div>
  )
}
