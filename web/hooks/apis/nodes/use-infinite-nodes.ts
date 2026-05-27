import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { TNode } from "@/types/node-type"
import { useInfiniteQuery } from "@tanstack/react-query"

export const useInfiniteNodes = (
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
    limit?: number
  } = {}
) => {
  const { enabled = true, ...rest } = params
  const scope = rest.scope ?? "normal"
  const currentLimit = Number(rest.limit ?? 25)

  return useInfiniteQuery({
    queryKey: nodeKeys.list({
      parentId: rest.parentId,
      type: rest.type,
      modified: rest.modified,
      folderGroup: rest.folderGroup,
      sortBy: rest.sortBy,
      sortDirection: rest.sortDirection,
      status: rest.status,
      keyword: rest.debounceKeyword,
      limit: currentLimit,
      scope,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      fetchNodes({
        parentId: rest.parentId,
        type: rest.type,
        modified: rest.modified,
        folderGroup: rest.folderGroup,
        sortBy: rest.sortBy,
        sortDirection: rest.sortDirection,
        status: rest.status,
        keyword: rest.debounceKeyword,
        limit: currentLimit,
        page: pageParam,
        scope,
      }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data?.pagination
      if (!pagination || !pagination.has_next_page) return undefined
      return pagination.page + 1
    },
    refetchInterval: (query) => {
      const infiniteData = query.state.data
      if (!infiniteData) return false

      const hasProcessing = infiniteData.pages.some((page) =>
        page.data?.items.some(
          (node: TNode) =>
            node.preview_status === "processing" ||
            node.preview_status === "pending"
        )
      )

      return hasProcessing ? 2000 : false
    },
    enabled,
  })
}
