import { nodeKeys } from "@/lib/query-keys"
import { createNode } from "@/services/node-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useCreateNode() {
  return useMutation({
    mutationFn: (params: { name: string; parentId?: string }) =>
      createNode(params),
    onError(error) {
      toast.error("Create folder failed", {
        description: error.message || "There was an issue creating folder.",
      })
    },
    onSuccess(_data, _variables, _onMutateResult, context) {
      toast.success("Create folder successfull", {
        description: "Your folder has been created successfully.",
      })
      context.client.invalidateQueries({ queryKey: nodeKeys.lists() })
    },
  })
}
