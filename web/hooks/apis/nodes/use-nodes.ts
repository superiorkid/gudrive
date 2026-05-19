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
    debounceKeyword?: string
    enabled?: boolean
    scope?: "normal" | "starred"
  } = {}
) => {
  const { enabled = true, ...rest } = params

  const scope = rest.scope ?? "normal"

  return useQuery({
    queryKey: nodeKeys.list({
      parentId: rest.parentId,
      type: rest.type,
      modified: rest.modified,
      folderGroup: rest.folderGroup,
      sortBy: rest.sortBy,
      sortDirection: rest.sortDirection,
      status: rest.status,
      keyword: rest.debounceKeyword,
      scope,
    }),
    queryFn: () =>
      fetchNodes({
        parentId: rest.parentId,
        type: rest.type,
        modified: rest.modified,
        folderGroup: rest.folderGroup,
        sortBy: rest.sortBy,
        sortDirection: rest.sortDirection,
        status: rest.status,
        keyword: rest.debounceKeyword,
        scope,
      }),
    refetchInterval: (query) => {
      const res = query.state.data

      if (!res) return false

      const hasProcessing = res.data?.some(
        (node) =>
          node.preview_status === "processing" ||
          node.preview_status === "pending"
      )

      return hasProcessing ? 2000 : false
    },
    enabled,
  })
}
