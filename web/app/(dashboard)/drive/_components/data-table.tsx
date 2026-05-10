"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { TNode } from "@/types/node-type"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"

interface DataTableProps<TData extends TNode, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends TNode, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleNodeNavigation = (node: TNode) => {
    if (node.type === "folder") {
      router.push(`/drive/folders/${node.id}`)
    } else {
      console.log("Opening file preview for:", node.name)
    }
  }

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
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onDoubleClick={() => handleNodeNavigation(row.original)}
                className={cn(
                  "transition-colors select-none",
                  row.original.type === "folder"
                    ? "cursor-pointer"
                    : "cursor-default"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-base text-muted-foreground"
              >
                This folder is currently empty. Drag and drop files here to
                upload them or use the &quot;New&quot; button to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
