import { LoginSchema } from "@/app/(auth)/enter/schema"
import { login } from "@/services/auth-service"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useLogin() {
  const { replace } = useRouter()

  return useMutation({
    mutationFn: (payload: LoginSchema) => login(payload),
    onError() {
      toast.error("Login failed")
    },
    onSuccess() {
      toast.success("Login successful")
      // window.location.href = "/drive/my-drive"
      replace("/drive/my-drive")
    },
  })
}
