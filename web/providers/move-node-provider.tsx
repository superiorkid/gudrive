"use client"

import React, { createContext, useContext, useMemo, useState } from "react"

type MoveOperation = "cut" | "copy" | null
type MoveNodeContextProps = {
  operation: MoveOperation
  nodeIds: Array<string>
  hasItems: boolean
  setCutNodes: (nodeIds: Array<string>) => void
  setCopyNodes: (nodeIds: Array<string>) => void
  clearClipboard: () => void
  isNodeInClipboard: (nodeId: string) => boolean
}

export const MoveNodeContext = createContext<MoveNodeContextProps | null>(null)

export const MoveNodeContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [nodeIds, setNodeIds] = useState<Array<string>>([])
  const [operation, setOperation] = useState<MoveOperation>(null)

  const setCutNodes = (nodeIds: Array<string>) => {
    setOperation("cut")
    setNodeIds(nodeIds)
  }

  const setCopyNodes = (nodeIds: Array<string>) => {
    setOperation("copy")
    setNodeIds(nodeIds)
  }

  const clearClipboard = () => {
    setOperation(null)
    setNodeIds([])
  }

  const isNodeInClipboard = (nodeId: string) => {
    return nodeIds.includes(nodeId)
  }

  const value = useMemo<MoveNodeContextProps>(
    () => ({
      operation,
      nodeIds,
      setCutNodes,
      setCopyNodes,
      clearClipboard,
      isNodeInClipboard,
      hasItems: nodeIds.length > 0,
    }),
    [operation, nodeIds]
  )

  return (
    <MoveNodeContext.Provider value={value}>
      {children}
    </MoveNodeContext.Provider>
  )
}

export const useMoveNode = () => {
  const context = useContext(MoveNodeContext)
  if (!context) {
    throw new Error("useMoveNode must be used within a MoveNodeContextProvider")
  }
  return context
}
