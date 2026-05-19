import { authKeys } from "@/lib/query-keys"
import { getSession } from "@/services/auth-service"
import { useQuery } from "@tanstack/react-query"

export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: getSession,
  })
}
