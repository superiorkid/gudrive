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
import { useMoveNode } from "@/providers/move-node-provider"
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

  const handleNodeNavigation = (node: TNode) => {
    if (node.type === "folder" && !pathname.includes("trash")) {
      push(`/drive/folders/${node.id}?${searchParams.toString()}`)
    } else {
      console.log("Opening file preview for:", node.name)
    }
  }

  const { isNodeInClipboard } = useMoveNode()

  return (
    <div className="overflow-hidden rounded-md border">
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
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onDoubleClick={() => handleNodeNavigation(row.original)}
                  className={cn(
                    "transition-colors select-none",
                    row.original.type === "folder"
                      ? "cursor-pointer"
                      : "cursor-default",
                    isInClipboard && "bg-muted"
                  )}
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
