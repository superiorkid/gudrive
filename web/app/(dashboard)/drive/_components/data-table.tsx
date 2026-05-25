"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDisplay } from "@/hooks/use-display"
import { cn } from "@/lib/utils"
import { useClipboard } from "@/providers/clipboard-provider"
import { useNodeSelection } from "@/providers/node-selection-provider"
import { TNode } from "@/types/node-type"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { usePathname, useRouter } from "next/navigation"
import NoItemsView from "../../_components/no-items-view"

interface DataTableProps<TData extends TNode, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends TNode, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const { push } = useRouter()
  const pathname = usePathname()
  const [display] = useDisplay()
  const searchParams = new URLSearchParams({ display })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { selectSingleNode, toggleSelectedNode, isSelected } =
    useNodeSelection()

  const handleNodeNavigation = (node: TNode) => {
    if (node.type === "folder" && !pathname.includes("trash")) {
      push(`/drive/folders/${node.id}?${searchParams.toString()}`)
    } else {
      console.log("Opening file preview for:", node.name)
    }
  }

  const { isNodeInClipboard } = useClipboard()

  return (
    <div
      className="overflow-hidden rounded-md border"
      onContextMenu={(event) => {
        event.stopPropagation()
      }}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const isInClipboard = isNodeInClipboard(row.original.id)
              const isCurrentSelected = isSelected(row.original.id)

              return (
                <TableRow
                  key={row.id}
                  data-state={isCurrentSelected && "selected"}
                  onDoubleClick={() => handleNodeNavigation(row.original)}
                  className={cn(
                    "transition-colors select-none",
                    row.original.type === "folder"
                      ? "cursor-pointer"
                      : "cursor-default",
                    isCurrentSelected &&
                      "bg-blue-100 hover:bg-blue-200/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/40",
                    isInClipboard && "bg-muted/60 opacity-60"
                  )}
                  onClick={(event) => {
                    event.stopPropagation()

                    if (event.ctrlKey || event.metaKey) {
                      toggleSelectedNode(row.original.id)
                      return
                    }

                    if (!isCurrentSelected) {
                      selectSingleNode(row.original.id)
                    } else {
                      toggleSelectedNode(row.original.id)
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-base text-muted-foreground"
              >
                <NoItemsView />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
