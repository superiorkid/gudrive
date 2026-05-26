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

  const currentSection = useMemo(() => {
    if (pathname.includes("trash")) return "trash"
    if (pathname.includes("my-drive")) return "my-drive"
    if (pathname.includes("folders")) return "folders"

    return null
  }, [pathname])

  const isTrashPage = currentSection === "trash"

  const { selectedNodeIds, clearSelection } = useNodeSelection()
  const { clearClipboard } = useClipboard()

  const hasSelectedItems = selectedNodeIds.length > 0

  const previousSectionRef = useRef<string | null>(null)

  useEffect(() => {
    const previousSection = previousSectionRef.current

    // clear selection when moving between sections
    if (previousSection && previousSection !== currentSection) {
      clearSelection()
      clearClipboard()
    }

    previousSectionRef.current = currentSection
  }, [currentSection, clearSelection, clearClipboard])

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
