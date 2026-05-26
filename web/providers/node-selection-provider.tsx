"use client"

import { createContext, useContext, useMemo, useState } from "react"

export type SelectedNode = {
  id: string
  isStarred: boolean
  type: "file" | "folder"
}

type NodeSelectionContextProps = {
  selectedNodes: SelectedNode[]

  selectedNodeIds: string[]

  selectSingleNode: (node: SelectedNode) => void

  toggleSelectedNode: (node: SelectedNode) => void

  selectMultipleNodes: (nodes: SelectedNode[]) => void

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
  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([])

  const selectedNodeIds = useMemo(
    () => selectedNodes.map((node) => node.id),
    [selectedNodes]
  )

  const selectSingleNode = (node: SelectedNode) => {
    setSelectedNodes([node])
  }

  const toggleSelectedNode = (node: SelectedNode) => {
    setSelectedNodes((prev) => {
      const exists = prev.some((n) => n.id === node.id)

      if (exists) {
        return prev.filter((n) => n.id !== node.id)
      }

      return [...prev, node]
    })
  }

  const selectMultipleNodes = (nodes: SelectedNode[]) => {
    setSelectedNodes(nodes)
  }

  const clearSelection = () => {
    setSelectedNodes([])
  }

  const isSelected = (nodeId: string) => {
    return selectedNodes.some((node) => node.id === nodeId)
  }

  const value = useMemo(
    () => ({
      selectedNodes,
      selectedNodeIds,

      selectSingleNode,
      toggleSelectedNode,
      selectMultipleNodes,

      clearSelection,

      isSelected,
    }),
    [selectedNodes, selectedNodeIds]
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
