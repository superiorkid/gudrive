import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { useQuery } from "@tanstack/react-query"

export const useNodes = (
  params: { parentId?: string; type?: string; modified?: string } = {}
) => {
  return useQuery({
    queryKey: nodeKeys.list({
      parentId: params.parentId,
      type: params.type,
      modified: params.modified,
    }),
    queryFn: () =>
      fetchNodes({
        parentId: params.parentId,
        type: params.type,
        modified: params.modified,
      }),
  })
}
