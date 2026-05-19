import { RegisterSchema } from "@/app/(auth)/register/schema"
import { register } from "@/services/auth-service"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useRegister() {
  const { replace } = useRouter()

  return useMutation({
    mutationFn: (payload: RegisterSchema) => register(payload),
    onError() {
      toast.error("Registration failed")
    },
    onSuccess() {
      toast.success("Registration successful")
      replace("/enter")
    },
  })
}
