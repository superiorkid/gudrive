"use client"

import { createContext, useContext, useMemo, useState } from "react"

type ClipboardOperation = "cut" | "copy" | null

type ClipboardContextProps = {
  operation: ClipboardOperation

  clipboardNodeIds: string[]

  cutNodes: (nodeIds: string[]) => void
  copyNodes: (nodeIds: string[]) => void

  clearClipboard: () => void

  hasItems: boolean
  isNodeInClipboard: (nodeId: string) => boolean
}

export const ClipboardContext = createContext<ClipboardContextProps | null>(
  null
)

export const ClipboardProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [clipboardNodeIds, setClipboardNodeIds] = useState<string[]>([])
  const [operation, setOperation] = useState<ClipboardOperation>(null)

  const cutNodes = (nodeIds: string[]) => {
    setOperation("cut")
    setClipboardNodeIds(nodeIds)
  }

  const copyNodes = (nodeIds: string[]) => {
    setOperation("copy")
    setClipboardNodeIds(nodeIds)
  }

  const clearClipboard = () => {
    setOperation(null)
    setClipboardNodeIds([])
  }

  const isNodeInClipboard = (nodeId: string) => {
    return clipboardNodeIds.includes(nodeId)
  }

  const value = useMemo(
    () => ({
      operation,
      clipboardNodeIds,
      cutNodes,
      copyNodes,
      clearClipboard,
      hasItems: clipboardNodeIds.length > 0,
      isNodeInClipboard,
    }),
    [operation, clipboardNodeIds]
  )

  return (
    <ClipboardContext.Provider value={value}>
      {children}
    </ClipboardContext.Provider>
  )
}

export const useClipboard = () => {
  const context = useContext(ClipboardContext)
  if (!context) {
    throw new Error("useClipboard must be used within a ClipboardProvider")
  }
  return context
}
