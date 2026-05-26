import { nodeKeys } from "@/lib/query-keys"
import { deleteNode } from "@/services/node-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useSoftDeleteNode(params?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (nodeIds: Array<string>) => deleteNode(nodeIds),
    onError(error) {
      toast.error("Error move file/folder to trash", {
        description:
          error.message || "There was an issue move file/folder to trash.",
      })
    },
    onSuccess(_data, _variables, _onMutateResult, context) {
      toast.success("Move file/folder to trash successfully", {
        description: "Your file/folder has been moved to trash successfully.",
      })
      context.client.invalidateQueries({ queryKey: nodeKeys.lists() })
      params?.onSuccess?.()
    },
  })
}
