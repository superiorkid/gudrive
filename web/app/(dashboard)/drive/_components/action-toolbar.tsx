"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useForceDeleteNode } from "@/hooks/apis/nodes/use-force-delete-node"
import { useRestoreNode } from "@/hooks/apis/nodes/use-restore-node"
import { useSoftDeleteNode } from "@/hooks/apis/nodes/use-soft-delete-node"
import { useToggleStar } from "@/hooks/apis/nodes/use-toggle-star"
import { cn } from "@/lib/utils"
import { useClipboard } from "@/providers/clipboard-provider"
import { useNodeSelection } from "@/providers/node-selection-provider"
import {
  CopyIcon,
  DownloadIcon,
  LucideIcon,
  RotateCcwIcon,
  ScissorsIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

type Props = {
  isTrashPage: boolean
}

const ActionToolbar = ({ isTrashPage }: Props) => {
  const { selectedNodeIds, clearSelection, selectedNodes } = useNodeSelection()
  const { copyNodes, cutNodes } = useClipboard()

  const { mutate: softDeleteMutation, isPending: pendingSoftDelete } =
    useSoftDeleteNode({
      onSuccess: () => {
        clearSelection()
      },
    })
  const { mutate: restoreNodeMutation, isPending: restoreNodePending } =
    useRestoreNode({
      onSuccess: () => {
        clearSelection()
      },
    })
  const { mutate: forceDeleteMutation, isPending: forceDeletePending } =
    useForceDeleteNode({
      onSuccess: () => {
        clearSelection()
      },
    })
  const { mutate: toggleStarMutation, isPending: toggleStarPending } =
    useToggleStar({
      onSuccess: () => {
        clearSelection()
      },
    })

  const allSelectedAreStarred =
    selectedNodes.length > 0 && selectedNodes.every((node) => node.isStarred)

  return (
    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-2 pr-3 dark:border-blue-900/50 dark:bg-blue-950/40">
      <Button
        size="icon"
        variant="ghost"
        onClick={clearSelection}
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
          {isTrashPage ? (
            <>
              <ActionButton
                icon={RotateCcwIcon}
                label="Restore"
                disabled={restoreNodePending}
                onClick={() => {
                  restoreNodeMutation(selectedNodeIds)
                }}
              />

              <ActionButton
                icon={Trash2Icon}
                label="Delete Permanently"
                disabled={forceDeletePending}
                className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                onClick={() => {
                  forceDeleteMutation(selectedNodeIds)
                }}
              />
            </>
          ) : (
            <>
              <ActionButton
                disabled={toggleStarPending}
                label={
                  allSelectedAreStarred
                    ? "Remove from Starred"
                    : "Add to Starred"
                }
                onClick={() => {
                  toggleStarMutation({
                    nodeIds: selectedNodeIds,
                    allSelectedAreStarred,
                  })
                }}
              >
                <StarIcon
                  className={cn(
                    "size-4",
                    allSelectedAreStarred && "fill-current text-yellow-500"
                  )}
                />
              </ActionButton>
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
                disabled={pendingSoftDelete}
                className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                onClick={() => {
                  softDeleteMutation(selectedNodeIds)
                }}
              />
            </>
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}

type ActionButtonProps = {
  icon?: LucideIcon
  children?: React.ReactNode

  label: string
  onClick?: () => void
  className?: string
  disabled?: boolean
}

const ActionButton = ({
  icon: Icon,
  children,
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
        {children ? children : Icon ? <Icon className="size-4" /> : null}

        <span className="sr-only">{label}</span>
      </Button>
    </TooltipTrigger>

    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
)

export default ActionToolbar
