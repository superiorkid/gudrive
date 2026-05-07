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

type Props = {
  data: Array<TNode>
}

const GridNodes = ({ data }: Props) => {
  const folders = data.filter((node) => node.type === "folder")
  const files = data.filter((node) => node.type === "file")

  return (
    <div className="mt-4 space-y-8">
      <div className="grid grid-cols-4 gap-4 2xl:grid-cols-7">
        {folders.map((node) => (
          <div key={`${node.name}-${node.size}`}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {getFileIcon(node.type, node.mime_type || "")}
                    </div>
                    <span className="line-clamp-1">{node.name}</span>
                  </div>
                </CardTitle>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-2 w-2 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuItem>
                        <DownloadIcon className="mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <PencilIcon className="mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <StarIcon className="mr-2" />
                        Add to Starred
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <TrashIcon className="mr-2" />
                        Move to Trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4 2xl:grid-cols-7">
        {files.map((node) => (
          <div key={`${node.name}-${node.size}`}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {getFileIcon(node.type, node.mime_type || "")}
                    </div>
                    <span className="line-clamp-1">{node.name}</span>
                  </div>
                </CardTitle>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-2 w-2 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuItem>
                        <DownloadIcon className="mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <PencilIcon className="mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <StarIcon className="mr-2" />
                        Add to Starred
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <TrashIcon className="mr-2" />
                        Move to Trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-square">
                  <Image
                    fill
                    src="https://images.unsplash.com/photo-1566396223585-c8fbf7fa6b6d?q=80&w=1549&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt={`image preview ${node.name}`}
                    className="object-cover"
                    quality={80}
                    decoding="async"
                    loading="lazy"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GridNodes
