import { logout } from "@/services/auth-service"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useLogout() {
  const { replace } = useRouter()

  return useMutation({
    mutationFn: () => logout(),
    onError() {
      toast.error("Logged out failed")
    },
    onSuccess() {
      toast.success("Logged out successful")
      replace("/enter")
    },
  })
}
