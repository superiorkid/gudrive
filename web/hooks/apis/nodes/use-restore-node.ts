import { nodeKeys } from "@/lib/query-keys"
import { restoreNode } from "@/services/node-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useRestoreNode(params?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (nodeIds: Array<string>) => restoreNode(nodeIds),
    onError(error) {
      toast.error("Error move restore file/folder", {
        description:
          error.message || "There was an issue move file/folder to trash.",
      })
    },
    onSuccess(_data, _variables, _onMutateResult, context) {
      toast.success("Restore file/folder successfully", {
        description:
          "Your file/folder has been restored from trash successfully.",
      })
      context.client.invalidateQueries({ queryKey: nodeKeys.lists() })
      params?.onSuccess?.()
    },
  })
}
