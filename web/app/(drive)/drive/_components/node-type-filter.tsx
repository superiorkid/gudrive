"use client"

import { Button } from "@/components/ui/button"
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
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            variant={!!type ? "default" : "outline"}
            className="capitalize"
          >
            {ActiveIcon ? (
              <ActiveIcon className="mr-2 size-4" />
            ) : (
              <TypeIcon className="mr-2 size-4 opacity-50" />
            )}
            {activeType?.label || "Type"}
            <ChevronDownIcon className="ml-2 size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setType(null)}
          className="h-10 px-2 text-muted-foreground hover:text-destructive"
        >
          <XIcon className="mr-1 size-4" />
          Clear
        </Button>
      )}
    </div>
  )
}

export default NodeTypeFilter
