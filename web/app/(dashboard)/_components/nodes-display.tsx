"use client"

import { Display, useDisplay } from "@/hooks/use-display"
import { TNode } from "@/types/node-type"
import { columns } from "../drive/(drive)/my-drive/_components/columns"
import { DataTable } from "../drive/_components/data-table"
import GridNodes from "./grid-nodes"

type Props = {
  data: Array<TNode>
}

const NodesDisplay = ({ data }: Props) => {
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
