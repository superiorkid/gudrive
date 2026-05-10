import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { useQuery } from "@tanstack/react-query"

export const useNodes = (parentId?: string) => {
  return useQuery({
    queryKey: nodeKeys.list(parentId),
    queryFn: () => fetchNodes({ parentId }),
  })
}
