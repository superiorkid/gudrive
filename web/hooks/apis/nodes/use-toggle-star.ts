import { nodeKeys, statKeys } from "@/lib/query-keys"
import { toggleStar } from "@/services/node-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function useToggleStar(params?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: async ({
      nodeIds,
    }: {
      nodeIds: Array<string>
      allSelectedAreStarred: boolean
    }) => {
      return toggleStar(nodeIds)
    },

    onError(error, variables) {
      toast.error(
        variables.allSelectedAreStarred
          ? "Remove from Starred failed"
          : "Add to Starred failed",
        {
          description:
            error.message || "There was an issue updating starred items.",
        }
      )
    },

    onSuccess(data, variables, _onMutateResult, context) {
      toast.success(
        variables.allSelectedAreStarred
          ? "Removed from Starred"
          : "Added to Starred",
        {
          description: variables.allSelectedAreStarred
            ? "Selected items were removed from starred."
            : "Selected items were added to starred.",
        }
      )

      context.client.invalidateQueries({
        queryKey: nodeKeys.lists(),
      })

      context.client.invalidateQueries({
        queryKey: statKeys.overview(),
      })

      params?.onSuccess?.()
    },
  })
}
