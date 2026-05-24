"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadProps,
} from "@/components/ui/file-upload"
import { useCompleteUpload } from "@/hooks/apis/uploads/use-complete-upload"
import { useInitUpload } from "@/hooks/apis/uploads/use-init-upload"
import { useUploadChunk } from "@/hooks/apis/uploads/use-upload-chunk"
import { useUploadOffset } from "@/hooks/apis/uploads/use-upload-offset"
import axios from "axios"
import { PauseIcon, PlayIcon, XIcon } from "lucide-react"
import { useParams } from "next/navigation"
import React, { useRef, useState } from "react"
import { toast } from "sonner"

type Props = {
  children: React.ReactNode
}

type UploadControl = {
  controller?: AbortController
  uploadId?: string
  offset: number
  status: "uploading" | "paused" | "completed" | "error"
  chunkSize: number
}

type UploadFile = {
  id: string
  file: File
}

const FileUploads = ({ children }: Props) => {
  const [files, setFiles] = React.useState<UploadFile[]>([])
  const { folderId } = useParams<{ folderId?: string }>()

  const [uploadStates, setUploadStates] = useState<
    Record<string, UploadControl>
  >({})

  const uploadsRef = useRef<Map<string, UploadControl>>(new Map())

  const callbacksRef = useRef<{
    onProgress?: (file: File, progress: number) => void
    onSuccess?: (file: File) => void
    onError?: (file: File, error: Error) => void
  }>({})

  const { mutateAsync: initUpload } = useInitUpload()
  const { mutateAsync: uploadChunk } = useUploadChunk()
  const { mutateAsync: completeUpload } = useCompleteUpload()
  const { mutateAsync: getOffset } = useUploadOffset()

  const syncState = (key: string, control: UploadControl) => {
    setUploadStates((prev) => ({
      ...prev,
      [key]: { ...control },
    }))
  }

  const continueUpload = async (
    uploadFile: UploadFile,
    control: UploadControl,
    onProgress?: (file: File, progress: number) => void
  ) => {
    const { file, id } = uploadFile

    while (control.offset < file.size) {
      if (control.status === "paused") return

      const controller = new AbortController()

      control.controller = controller
      control.status = "uploading"

      syncState(id, control)

      const chunk = file.slice(
        control.offset,
        control.offset + control.chunkSize
      )

      const res = await uploadChunk({
        chunk,
        uploadId: control.uploadId!,
        signal: controller.signal,
        offset: control.offset,
      })

      control.offset = res?.data.offset || 0

      syncState(id, control)

      const progress = (control.offset / file.size) * 100

      onProgress?.(file, progress)
    }

    await completeUpload(control.uploadId!)
  }

  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (incomingFiles, { onProgress, onSuccess, onError }) => {
      callbacksRef.current = {
        onProgress,
        onSuccess,
        onError,
      }

      const uploadFiles: UploadFile[] = incomingFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
      }))

      setFiles((prev) => [...prev, ...uploadFiles])

      try {
        await Promise.all(
          uploadFiles.map(async (uploadFile) => {
            const { file, id } = uploadFile

            try {
              let control = uploadsRef.current.get(id)

              // init upload
              if (!control) {
                const initRes = await initUpload({
                  folderId,
                  fileName: file.name,
                  fileSize: file.size,
                  mimeType: file.type,
                })

                control = {
                  offset: 0,
                  uploadId: initRes?.data.upload_id,
                  status: "uploading",
                  chunkSize: initRes?.data.chunk_size || 0,
                }

                uploadsRef.current.set(id, control)

                syncState(id, control)
              }

              const headRes = await getOffset(control.uploadId!)

              control.offset = Number(headRes?.headers["upload-offset"] || 0)

              syncState(id, control)

              await continueUpload(uploadFile, control, onProgress)

              control.status = "completed"

              syncState(id, control)

              onSuccess?.(file)
            } catch (error) {
              // ignore pause abort
              if (
                axios.isCancel(error) ||
                (error as Error).name === "CanceledError"
              ) {
                return
              }

              const err = axios.isAxiosError(error)
                ? new Error(error.response?.data.message || "Upload Failed")
                : (error as Error)

              const existing = uploadsRef.current.get(id)

              if (existing) {
                existing.status = "error"
                syncState(id, existing)
              }

              onError?.(file, err)
            }
          })
        )
      } catch (error) {
        console.error("Unexpected upload error:", error)
      }
    },
    [folderId]
  )

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
    })
  }, [])

  const pauseUpload = (uploadFile: UploadFile) => {
    const control = uploadsRef.current.get(uploadFile.id)

    if (!control) return

    control.status = "paused"

    control.controller?.abort()

    syncState(uploadFile.id, control)
  }

  const resumeUpload = async (uploadFile: UploadFile) => {
    const control = uploadsRef.current.get(uploadFile.id)

    if (!control || !control.uploadId) return

    if (control.status === "uploading") return

    try {
      const headRes = await getOffset(control.uploadId)

      control.offset = Number(headRes.headers["upload-offset"] || 0)

      control.status = "uploading"

      syncState(uploadFile.id, control)

      await continueUpload(uploadFile, control, callbacksRef.current.onProgress)

      control.status = "completed"

      syncState(uploadFile.id, control)

      callbacksRef.current.onSuccess?.(uploadFile.file)
    } catch (error) {
      if (axios.isCancel(error) || (error as Error).name === "CanceledError") {
        return
      }

      control.status = "error"

      syncState(uploadFile.id, control)

      callbacksRef.current.onError?.(uploadFile.file, error as Error)
    }
  }

  const removeUpload = (uploadFile: UploadFile) => {
    uploadsRef.current.delete(uploadFile.id)

    setUploadStates((prev) => {
      const copy = { ...prev }

      delete copy[uploadFile.id]

      return copy
    })

    setFiles((prev) => prev.filter((item) => item.id !== uploadFile.id))
  }

  return (
    <FileUpload
      value={files.map((f) => f.file)}
      onValueChange={() => {}}
      onUpload={onUpload}
      onFileReject={onFileReject}
      multiple
    >
      <FileUploadDropzone
        onClick={(e) => e.preventDefault()}
        className="group relative block min-h-dvh w-full items-stretch justify-start border-none p-0"
      >
        {children}

        <div className="pointer-events-none absolute inset-0 z-50 hidden items-center justify-center rounded-lg border-4 border-dashed border-blue-500 bg-blue-500/20 backdrop-blur-sm transition-opacity duration-150 group-data-dragging:flex">
          <div className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-2xl">
            Drop files to upload
          </div>
        </div>
      </FileUploadDropzone>

      <FileUploadList className="fixed right-6 bottom-6 z-50 w-80 rounded-lg border bg-background p-2 shadow-2xl">
        {files.map((uploadFile) => {
          const file = uploadFile.file

          const control = uploadStates[uploadFile.id]

          return (
            <FileUploadItem
              key={uploadFile.id}
              value={file}
              className="flex-col gap-2"
            >
              <div className="flex w-full items-center gap-2">
                <FileUploadItemPreview />

                <FileUploadItemMetadata />

                <ButtonGroup>
                  {control?.status === "uploading" && (
                    <Button
                      onClick={() => pauseUpload(uploadFile)}
                      size="icon"
                      variant="ghost"
                      className="size-8"
                    >
                      <PauseIcon className="size-4" />
                    </Button>
                  )}

                  {(control?.status === "paused" ||
                    control?.status === "error") && (
                    <Button
                      onClick={() => resumeUpload(uploadFile)}
                      size="icon"
                      variant="ghost"
                      className="size-8"
                    >
                      <PlayIcon className="size-4" />
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="destructive"
                    className="size-8"
                    onClick={() => removeUpload(uploadFile)}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </ButtonGroup>
              </div>

              <FileUploadItemProgress />
            </FileUploadItem>
          )
        })}
      </FileUploadList>
    </FileUpload>
  )
}

export default FileUploads
