import { nodeKeys } from "@/lib/query-keys"
import { fetchNodeDetail } from "@/services/node-service"
import { useQuery } from "@tanstack/react-query"

export const useNode = (id: string) => {
  return useQuery({
    queryKey: nodeKeys.detail(id),
    queryFn: () => fetchNodeDetail(id),
    enabled: !!id,
  })
}
