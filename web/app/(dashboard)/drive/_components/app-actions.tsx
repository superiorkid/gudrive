"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useClipboard } from "@/providers/clipboard-provider"
import { useNodeSelection } from "@/providers/node-selection-provider"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useMemo, useRef } from "react"
import ActionToolbar from "./action-toolbar"
import NodeFilters from "./node-filters"

const AppActions = () => {
  const pathname = usePathname()

  const isInsideDrive = useMemo(() => {
    return (
      pathname.includes("my-drive") ||
      pathname.includes("folders") ||
      pathname.includes("trash")
    )
  }, [pathname])

  const isTrashPage = pathname.includes("trash")

  const { selectedNodeIds, clearSelection } = useNodeSelection()
  const { clipboardNodeIds, clearClipboard } = useClipboard()

  const hasSelectedItems = selectedNodeIds.length > 0
  const previousPathnameRef = useRef<string>(pathname)

  useEffect(() => {
    const previousPathname = previousPathnameRef.current

    if (previousPathname !== pathname) {
      const wasTrash = previousPathname.includes("trash")
      const isNowTrash = pathname.includes("trash")

      if (!isInsideDrive || wasTrash !== isNowTrash) {
        clearSelection()
        clearClipboard()
      } else {
        if (!clipboardNodeIds || clipboardNodeIds.length === 0) {
          clearSelection()
        }
      }
    }

    previousPathnameRef.current = pathname
  }, [
    pathname,
    isInsideDrive,
    clipboardNodeIds,
    clearSelection,
    clearClipboard,
  ])

  if (hasSelectedItems) {
    return <ActionToolbar isTrashPage={isTrashPage} />
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

export default AppActions
