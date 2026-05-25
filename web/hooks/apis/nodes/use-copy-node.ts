import { nodeKeys } from "@/lib/query-keys"
import { copyNode } from "@/services/node-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useCopyNode(params: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (params: { parentId?: string; nodeIds: Array<string> }) =>
      copyNode({ parentId: params.parentId, nodeIds: params.nodeIds }),
    onError(error) {
      toast.error("Error copy file/folder", {
        description: error.message || "There was an issue copy file/folder.",
      })
    },
    onSuccess(_data, _variables, _onMutateResult, context) {
      toast.success("Update file/folder successfully", {
        description: "Your file/folder has been copied successfully.",
      })
      context.client.invalidateQueries({ queryKey: nodeKeys.details() })
      context.client.invalidateQueries({ queryKey: nodeKeys.lists() })

      params.onSuccess?.()
    },
  })
}
