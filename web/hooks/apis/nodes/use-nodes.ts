import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { useQuery } from "@tanstack/react-query"

export const useNodes = (
  params: {
    parentId?: string
    type?: string
    modified?: string
    folderGroup?: string
    sortDirection?: string
    sortBy?: string
    status?: "active" | "trashed"
  } = {}
) => {
  return useQuery({
    queryKey: nodeKeys.list({
      parentId: params.parentId,
      type: params.type,
      modified: params.modified,
      folderGroup: params.folderGroup,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      status: params.status,
    }),
    queryFn: () =>
      fetchNodes({
        parentId: params.parentId,
        type: params.type,
        modified: params.modified,
        folderGroup: params.folderGroup,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
        status: params.status,
      }),
    refetchInterval: (query) => {
      const res = query.state.data
      if (!res) return false

      const hasProcessing = res.data.some(
        (node) =>
          node.preview_status === "processing" ||
          node.preview_status === "pending"
      )

      return hasProcessing ? 2000 : false
    },
  })
}
