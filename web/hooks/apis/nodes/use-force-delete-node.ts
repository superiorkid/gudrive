import { nodeKeys, statKeys } from "@/lib/query-keys"
import { forceDelete } from "@/services/node-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useForceDeleteNode() {
  return useMutation({
    mutationFn: (nodeId: string) => forceDelete(nodeId),
    onError(error) {
      toast.error("Error Permanently Delete file/folder", {
        description:
          error.message ||
          "There was an issue with permamently delete folder/file.",
      })
    },
    onSuccess(_data, _variables, _onMutateResult, context) {
      toast.success("Permaently delete file/folder successfully", {
        description: "Your file/folder has been deleted successfully.",
      })
      context.client.invalidateQueries({ queryKey: nodeKeys.lists() })
      context.client.invalidateQueries({ queryKey: statKeys.overview() })
    },
  })
}
