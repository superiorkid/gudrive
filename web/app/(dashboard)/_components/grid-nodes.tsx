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
import { useDisplay } from "@/hooks/use-display"
import { useFoldersGroup } from "@/hooks/use-folders-group"
import { getFileIcon } from "@/lib/folder-icon"
import { TNode } from "@/types/node-type"
import {
  DownloadIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

type Props = {
  data: Array<TNode>
}

const GridNodes = ({ data }: Props) => {
  const router = useRouter()
  const [display] = useDisplay()
  const [folderGroup] = useFoldersGroup()

  const handleNodeNavigation = (node: TNode) => {
    if (node.type === "folder") {
      router.push(`/drive/folders/${node.id}?display=${display}`)
    } else {
      console.log("Opening file preview for:", node.name)
    }
  }

  if (!data.length) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center rounded-xl bg-muted/5 p-8 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FolderOpenIcon className="h-10 w-10 text-muted-foreground/60" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">No items found</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This folder is currently empty. Drag and drop files here to upload
          them or use the &quot;New&quot; button to get started.
        </p>
      </div>
    )
  }

  const folders =
    folderGroup === "top" ? data.filter((n) => n.type === "folder") : data

  const files =
    folderGroup === "top" ? data.filter((n) => n.type !== "folder") : []

  const renderGrid = (nodes: TNode[]) => (
    <div className="grid grid-cols-4 gap-4 2xl:grid-cols-7">
      {nodes.map((node) => (
        <div key={node.id} onDoubleClick={() => handleNodeNavigation(node)}>
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

            {node.type === "file" && (
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
            )}
          </Card>
        </div>
      ))}
    </div>
  )

  return (
    <div className="mt-4">
      {folderGroup === "top" ? (
        <div className="space-y-8">
          {folders.length > 0 && renderGrid(folders)}
          {files.length > 0 && renderGrid(files)}
        </div>
      ) : (
        renderGrid(data)
      )}
    </div>
  )
}

export default GridNodes
