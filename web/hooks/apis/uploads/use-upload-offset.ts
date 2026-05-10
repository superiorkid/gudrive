import { getUploadOffset } from "@/services/upload-service"
import { useMutation } from "@tanstack/react-query"

export function useUploadOffset() {
  return useMutation({
    mutationFn: (uploadId: string) => getUploadOffset({ uploadId }),
  })
}
