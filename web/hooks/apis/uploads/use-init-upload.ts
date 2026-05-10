import { initializeUpload } from "@/services/upload-service"
import { useMutation } from "@tanstack/react-query"

export function useInitUpload() {
  return useMutation({
    mutationFn: (params: {
      folderId?: string
      fileName: string
      fileSize: number
      mimeType: string
    }) => initializeUpload(params),
  })
}
