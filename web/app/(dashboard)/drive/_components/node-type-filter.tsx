"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useType } from "@/hooks/use-type"
import { cn } from "@/lib/utils"
import {
  ArchiveIcon,
  ChevronDownIcon,
  FileTextIcon,
  FileTypeIcon,
  FolderIcon,
  ImageIcon,
  MusicIcon,
  PresentationIcon,
  Table2Icon,
  TypeIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"

const nodeTypes = [
  { label: "Folders", value: "folders", icon: FolderIcon },
  { label: "Documents", value: "documents", icon: FileTextIcon },
  { label: "Spreadsheets", value: "spreadsheets", icon: Table2Icon },
  { label: "Presentations", value: "presentations", icon: PresentationIcon },
  { label: "Photos & Images", value: "images", icon: ImageIcon },
  { label: "PDFs", value: "pdfs", icon: FileTypeIcon },
  { label: "Videos", value: "videos", icon: VideoIcon },
  { label: "Archives (.zip)", value: "archives", icon: ArchiveIcon },
  { label: "Audios", value: "audios", icon: MusicIcon },
]

const NodeTypeFilter = () => {
  const [type, setType] = useType()

  const activeType = nodeTypes.find((n) => n.value === type)
  const ActiveIcon = activeType?.icon || null

  return (
    <ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg" variant="outline" className="capitalize">
            {ActiveIcon ? (
              <ActiveIcon className="mr-2 size-4" />
            ) : (
              <TypeIcon className="mr-2 size-4 opacity-50" />
            )}
            {activeType?.label || "Type"}
            <ChevronDownIcon className="ml-2 size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-auto min-w-52">
          {nodeTypes.map((node) => {
            const Icon = node.icon
            return (
              <DropdownMenuItem
                key={node.value}
                onClick={() => setType(node.value)}
                className={cn(
                  "flex items-center gap-2",
                  type === node.value && "bg-accent font-medium"
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    type === node.value
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <span>{node.label}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {type && (
        <Button variant="destructive" size="lg" onClick={() => setType(null)}>
          <XIcon className="size-4" />
        </Button>
      )}
    </ButtonGroup>
  )
}

export default NodeTypeFilter
