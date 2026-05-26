"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useClipboard } from "@/providers/clipboard-provider"
import { useNodeSelection } from "@/providers/node-selection-provider"
import {
  CopyIcon,
  DownloadIcon,
  LucideIcon,
  ScissorsIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { Suspense } from "react"
import NodeFilters from "./node-filters"

const AppActions = () => {
  const { selectedNodeIds, clearSelection } = useNodeSelection()
  const hasSelectedItems = selectedNodeIds.length > 0

  const { cutNodes, copyNodes } = useClipboard()

  if (hasSelectedItems) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-2 pr-3 dark:border-blue-900/50 dark:bg-blue-950/40">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            clearSelection()
          }}
          className="size-8 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50"
          aria-label="Clear selection"
        >
          <XIcon className="size-4" />
        </Button>

        <div className="flex items-center gap-1.5 px-1">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedNodeIds.length} selected
          </span>
        </div>

        <Separator
          orientation="vertical"
          className="mx-1 h-6 bg-blue-200 dark:bg-blue-900"
        />

        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-0.5">
            <ActionButton icon={StarIcon} label="Add To Starred" />
            <ActionButton icon={DownloadIcon} label="Download" />
            <ActionButton
              icon={CopyIcon}
              label="Copy"
              onClick={() => {
                copyNodes(selectedNodeIds)
              }}
            />
            <ActionButton
              icon={ScissorsIcon}
              label="Cut"
              onClick={() => {
                cutNodes(selectedNodeIds)
              }}
            />
            <ActionButton
              icon={Trash2Icon}
              label="Delete"
              className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
            />
          </div>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center space-x-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`skeleton-${index}`} className="h-10 w-40" />
          ))}
        </div>
      }
    >
      <NodeFilters />
    </Suspense>
  )
}

type ActionButtonProps = {
  icon: LucideIcon
  label: string
  onClick?: () => void
  className?: string
  disabled?: boolean
}

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  className,
  disabled,
}: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="icon-lg"
        variant="ghost"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "rounded-full text-blue-900 hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50",
          className
        )}
      >
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
)

export default AppActions
