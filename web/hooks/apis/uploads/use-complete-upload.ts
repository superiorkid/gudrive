import { nodeKeys, statKeys } from "@/lib/query-keys"
import { completeUpload } from "@/services/upload-service"
import { useMutation } from "@tanstack/react-query"

export function useCompleteUpload() {
  return useMutation({
    mutationFn: (uploadId: string) => completeUpload({ uploadId }),
    onSuccess(_data, _variables, _onMutateResult, context) {
      context.client.invalidateQueries({ queryKey: nodeKeys.lists() })
      context.client.invalidateQueries({ queryKey: statKeys.overview() })
    },
  })
}
