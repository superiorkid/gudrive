import { nodeKeys } from "@/lib/query-keys"
import { toggleStar } from "@/services/node-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useToggleStar(isStarred: boolean) {
  return useMutation({
    mutationFn: (nodeId: string) => toggleStar(nodeId),
    onError(error) {
      toast.error(
        `${isStarred ? "Unstar Folder/File" : "Starred Folder/File"} failed`,
        {
          description:
            error.message ||
            `There was an issue ${isStarred ? "Unstar" : "Starred"}. File/Folder`,
        }
      )
    },
    onSuccess(_data, _variables, _onMutateResult, context) {
      toast.success(
        `${isStarred ? "Unstart" : "Starred"} File/Folder successfull`,
        {
          description: `Your file/folder has been ${isStarred ? "unstar" : "starred"} successfully.`,
        }
      )
      context.client.invalidateQueries({ queryKey: nodeKeys.lists() })
    },
  })
}
