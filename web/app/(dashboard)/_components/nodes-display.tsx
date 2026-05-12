"use client"

import { Display, useDisplay } from "@/hooks/use-display"
import { TNode } from "@/types/node-type"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "../drive/_components/data-table"
import GridNodes from "./grid-nodes"

type Props = {
  data: Array<TNode>
  columns: ColumnDef<TNode>[]
}

export const NodesDisplay = ({ data, columns }: Props) => {
  const [display] = useDisplay()

  return (
    <div>
      {display === Display.list ? (
        <DataTable columns={columns} data={data} />
      ) : (
        <GridNodes data={data} />
      )}
    </div>
  )
}

export default NodesDisplay
