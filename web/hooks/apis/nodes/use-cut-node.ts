import { nodeKeys } from "@/lib/query-keys"
import { moveNode } from "@/services/node-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useCutNode(params: { nodeId: string; onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (parentId?: string) =>
      moveNode({ parentId, nodeId: params.nodeId }),
    onError(error) {
      toast.error("Error move file/folder", {
        description: error.message || "There was an issue move file/folder.",
      })
    },
    onSuccess(_data, _variables, _onMutateResult, context) {
      toast.success("Update file/folder successfully", {
        description: "Your file/folder has been rename successfully.",
      })
      context.client.invalidateQueries({ queryKey: nodeKeys.details() })
      context.client.invalidateQueries({ queryKey: nodeKeys.lists() })

      params.onSuccess?.()
    },
  })
}
