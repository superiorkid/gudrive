"use client"

import NodeActionDropdown from "@/app/(dashboard)/_components/node-action-dropdown"
import { Button } from "@/components/ui/button"
import { getFileIcon } from "@/lib/folder-icon"
import { formatBytes, formatDate } from "@/lib/utils"
import { TNode } from "@/types/node-type"
import { ColumnDef } from "@tanstack/react-table"
import { HardDriveIcon, MoreHorizontalIcon, StarIcon } from "lucide-react"
import { useMemo } from "react"
import { useForceDeleteNode } from "./apis/nodes/use-force-delete-node"
import { useRestoreNode } from "./apis/nodes/use-restore-node"
import { useSoftDeleteNode } from "./apis/nodes/use-soft-delete-node"
import { useToggleStar } from "./apis/nodes/use-toggle-star"
import { useSortBy } from "./use-sort-by"

type TableVariant = "default" | "trash" | "starred"

export const useNodeColumns = (variant: TableVariant = "default") => {
  const [sortBy] = useSortBy()

  return useMemo(() => {
    const baseColumns: ColumnDef<TNode>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const { name, type, mime_type, is_starred } = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="size-5 shrink-0">
                {getFileIcon(type, mime_type || "")}
              </div>
              <span className="max-w-sm truncate font-medium 2xl:max-w-md">
                {name}
              </span>
              {is_starred && <StarIcon className="size-3 fill-foreground" />}
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
          return <div>{size ? formatBytes(size) : "Folder"}</div>
        },
      },
    ]

    const conditionalColumns: ColumnDef<TNode>[] = []

    const useDeletedAt = variant === "trash" && sortBy !== "date-modified"
    conditionalColumns.push({
      accessorKey: useDeletedAt ? "deleted_at" : "updated_at",
      header: useDeletedAt ? "Date Trashed" : "Last Modified",
      cell: ({ row }) => {
        const date = useDeletedAt
          ? row.original.deleted_at
          : row.original.updated_at
        return <div>{formatDate(date?.toString() || "")}</div>
      },
    })

    if (variant === "trash" || variant === "starred") {
      conditionalColumns.push({
        accessorKey: "parent",
        header: "Original Location",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-muted-foreground">
            <HardDriveIcon className="size-4" />
            <span>{row.original.parent?.name || "My Drive"}</span>
          </div>
        ),
      })
    }

    const actionColumn: ColumnDef<TNode> = {
      id: "actions",
      cell: ({ row }) => {
        const { id: nodeId, is_starred: isStarred, type } = row.original
        return (
          <ActionRow
            nodeId={nodeId}
            variant={variant}
            isStarred={isStarred}
            nodeType={type}
          />
        )
      },
    }

    return [...baseColumns, ...conditionalColumns, actionColumn]
  }, [variant, sortBy])
}

function ActionRow({
  nodeId,
  nodeType,
  variant,
  isStarred,
}: {
  nodeId: string
  variant: TableVariant
  isStarred: boolean
  nodeType: "folder" | "file"
}) {
  const { mutate: softDeleteMutation, isPending: pendingSoftDelete } =
    useSoftDeleteNode()
  const { mutate: restoreNodeMutation, isPending: restoreNodePending } =
    useRestoreNode()
  const { mutate: forceDeleteMutation, isPending: forceDeletePending } =
    useForceDeleteNode()

  const { mutate: toggleStarMutation, isPending: toggleStarPending } =
    useToggleStar(isStarred)

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
        nodeType={nodeType}
        isTrashPage={variant === "trash"}
        restoreNodeMutation={restoreNodeMutation}
        restoreNodePending={restoreNodePending}
        softDeleteMutation={softDeleteMutation}
        softDeleteNodePending={pendingSoftDelete}
        isStarred={isStarred}
        toggleStarMutation={toggleStarMutation}
        toggleStarPending={toggleStarPending}
        forceDeleteMutation={forceDeleteMutation}
        forceDeleteNodePending={forceDeletePending}
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
