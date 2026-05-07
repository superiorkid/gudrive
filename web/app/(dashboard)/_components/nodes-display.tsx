"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Display, useDisplay } from "@/hooks/use-display"
import { getFileIcon } from "@/lib/folder-icon"
import { TNode } from "@/types/node-type"
import {
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "lucide-react"
import Image from "next/image"
import { columns } from "../drive/(drive)/my-drive/_components/columns"
import { DataTable } from "../drive/(drive)/my-drive/_components/data-table"
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
