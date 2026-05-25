"use client"

import { createContext, useContext, useMemo, useState } from "react"

type NodeSelectionContextProps = {
  selectedNodeIds: string[]

  selectSingleNode: (nodeId: string) => void
  toggleSelectedNode: (nodeId: string) => void
  selectMultipleNodes: (nodeIds: string[]) => void

  clearSelection: () => void

  isSelected: (nodeId: string) => boolean
}

const NodeSelectionContext = createContext<NodeSelectionContextProps | null>(
  null
)

export const NodeSelectionProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

  const selectSingleNode = (nodeId: string) => {
    setSelectedNodeIds([nodeId])
  }

  const toggleSelectedNode = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      if (prev.includes(nodeId)) {
        return prev.filter((id) => id !== nodeId)
      }

      return [...prev, nodeId]
    })
  }

  const selectMultipleNodes = (nodeIds: string[]) => {
    setSelectedNodeIds(nodeIds)
  }

  const clearSelection = () => {
    setSelectedNodeIds([])
  }

  const isSelected = (nodeId: string) => {
    return selectedNodeIds.includes(nodeId)
  }

  const value = useMemo(
    () => ({
      selectedNodeIds,
      selectSingleNode,
      toggleSelectedNode,
      selectMultipleNodes,
      clearSelection,
      isSelected,
    }),
    [selectedNodeIds]
  )

  return (
    <NodeSelectionContext.Provider value={value}>
      {children}
    </NodeSelectionContext.Provider>
  )
}

export const useNodeSelection = () => {
  const context = useContext(NodeSelectionContext)

  if (!context) {
    throw new Error(
      "useNodeSelection must be used within NodeSelectionProvider"
    )
  }

  return context
}
