import { uploadChunk } from "@/services/upload-service"
import { useMutation } from "@tanstack/react-query"

export function useUploadChunk() {
  return useMutation({
    mutationFn: (params: {
      uploadId: string
      chunk: Blob
      offset: number
      signal?: AbortSignal
    }) => uploadChunk(params),
  })
}
