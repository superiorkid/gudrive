import { TUpdateNodeSchema } from "@/app/(dashboard)/schema"
import { nodeKeys } from "@/lib/query-keys"
import { updateNode } from "@/services/node-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useUpdateNode(params: {
  nodeId: string
  onSuccess?: () => void
}) {
  return useMutation({
    mutationFn: (payload: TUpdateNodeSchema) =>
      updateNode({ nodeId: params.nodeId, payload }),
    onError(error) {
      toast.error("Error update file/folder", {
        description: error.message || "There was an issue update file/folder.",
      })
    },
    onSuccess(_data, _variables, _onMutateResult, context) {
      toast.success("Update file/folder successfully", {
        description: "Your file/folder has been updated successfully.",
      })
      context.client.invalidateQueries({ queryKey: nodeKeys.details() })
      context.client.invalidateQueries({ queryKey: nodeKeys.lists() })

      params.onSuccess?.()
    },
  })
}
