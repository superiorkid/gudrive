import { LoginSchema } from "@/app/(auth)/enter/schema"
import { login } from "@/services/auth-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginSchema) => login(payload),
    onError() {
      toast.error("Registration failed")
    },
    onSuccess() {
      toast.success("Registration successful")
      window.location.href = "/drive/my-drive"
    },
  })
}
