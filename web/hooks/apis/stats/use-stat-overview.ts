import { statKeys } from "@/lib/query-keys"
import { fetchStatistics } from "@/services/stat-service"
import { useQuery } from "@tanstack/react-query"

export function useStatOverview() {
  return useQuery({
    queryKey: statKeys.overview(),
    queryFn: fetchStatistics,
  })
}
