import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { useQuery } from "@tanstack/react-query"

export const useNodes = (params: { parentId?: string; type?: string } = {}) => {
  return useQuery({
    queryKey: nodeKeys.list({ parentId: params.parentId, type: params.type }),
    queryFn: () => fetchNodes({ parentId: params.parentId, type: params.type }),
  })
}
