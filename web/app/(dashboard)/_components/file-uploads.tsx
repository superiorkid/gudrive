"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
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

const FileUploads = ({ children }: Props) => {
  const [files, setFiles] = React.useState<File[]>([])
  const { folderId } = useParams<{ folderId?: string }>()
  const [uploadStates, setUploadStates] = useState<
    Record<string, UploadControl>
  >({})

  const uploadsRef = useRef<Map<string, UploadControl>>(new Map())
  const callbacksRef = useRef<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onProgress?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError?: any
  }>({})

  const { mutateAsync: initUpload } = useInitUpload()
  const { mutateAsync: uploadChunk } = useUploadChunk()
  const { mutateAsync: completeUpload } = useCompleteUpload({
    onSuccess: () => {
      setFiles([])
    },
  })
  const { mutateAsync: getOffset } = useUploadOffset()

  const syncState = (key: string, control: UploadControl) => {
    setUploadStates((prev) => ({
      ...prev,
      [key]: { ...control },
    }))
  }

  const continueUpload = async (
    file: File,
    control: UploadControl,
    onProgress: (file: File, progress: number) => void
  ) => {
    const key = `${file.name}-${file.size}`
    while (control.offset < file.size) {
      if (control.status === "paused") return

      const controller = new AbortController()
      control.controller = controller
      control.status = "uploading"

      syncState(key, control)

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
      const progress = (control.offset / file.size) * 100
      onProgress(file, progress)
    }

    await completeUpload(control.uploadId!)
  }

  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      callbacksRef.current = { onProgress, onSuccess, onError }
      try {
        await Promise.all(
          files.map(async (file) => {
            const key = `${file.name}-${file.size}`

            try {
              let control = uploadsRef.current.get(key)

              // init (only once)
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
                uploadsRef.current.set(key, control)
                syncState(key, control)
              }

              const headRes = await getOffset(control.uploadId as string)
              control.offset = Number(headRes?.headers["upload-offset"] || 0)

              await continueUpload(file, control, onProgress)
              control.status = "completed"
              syncState(key, control)
              onSuccess(file)
            } catch (error) {
              // // ignore abort error (pause)
              // if (
              //   axios.isCancel(error) ||
              //   (error as Error).name === "CanceledError"
              // ) {
              //   return
              // }

              const err = axios.isAxiosError(error)
                ? new Error(error.response?.data.message || "Upload Failed")
                : (error as Error)

              uploadsRef.current.get(key)!.status = "error"
              syncState(key, uploadsRef.current.get(key)!)
              onError(file, err)
            }
          })
        )
      } catch (error) {
        // This handles any error that might occur outside the individual upload processes
        console.error("Unexpected error during upload:", error)
      }
    },
    [folderId]
  )

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
    })
  }, [])

  const pauseUpload = (file: File) => {
    const key = `${file.name}-${file.size}`
    const control = uploadsRef.current.get(key)
    if (!control) return
    control.status = "paused"
    control.controller?.abort()
    syncState(key, control)
  }

  const resumeUpload = async (file: File) => {
    const key = `${file.name}-${file.size}`
    const control = uploadsRef.current.get(key)
    if (!control || !control.uploadId) return

    if (control.status === "uploading") return

    try {
      const headRes = await getOffset(control.uploadId as string)

      control.offset = Number(headRes.headers["upload-offset"] || 0)
      control.status = "uploading"
      syncState(key, control)

      await continueUpload(file, control, callbacksRef.current.onProgress)

      control.status = "completed"
      syncState(key, control)

      callbacksRef.current.onSuccess(file)
    } catch (error) {
      if (axios.isCancel(error) || (error as Error).name === "CanceledError") {
        return
      }

      control.status = "error"
      syncState(key, control)

      callbacksRef.current.onError(file, error as Error)
    }
  }

  return (
    <div className="relative w-full rounded-xl">
      <FileUpload
        value={files}
        onValueChange={setFiles}
        onUpload={onUpload}
        onFileReject={onFileReject}
        className="absolute inset-0 z-0"
        multiple
      >
        <FileUploadDropzone
          className="aspect-video w-full border-none p-0 transition-colors hover:bg-background data-dragging:bg-sky-100"
          onClick={(event) => event.preventDefault()}
        />

        <FileUploadList className="fixed right-6 bottom-6 z-100 w-80 rounded-lg border bg-background p-2 shadow-2xl">
          {files.map((file: any) => {
            const key = `${file.name}-${file.size}`
            const control = uploadStates[key]

            return (
              <FileUploadItem key={key} value={file} className="flex-col gap-2">
                <div className="flex w-full items-center gap-2">
                  <FileUploadItemPreview />
                  <FileUploadItemMetadata />
                  <ButtonGroup>
                    {control?.status === "uploading" && (
                      <Button
                        onClick={() => pauseUpload(file)}
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
                        onClick={() => resumeUpload(file)}
                        size="icon"
                        variant="ghost"
                        className="size-8"
                      >
                        <PlayIcon className="size-4" />
                      </Button>
                    )}
                    <FileUploadItemDelete asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="size-8"
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </FileUploadItemDelete>
                  </ButtonGroup>
                </div>
                <FileUploadItemProgress />
              </FileUploadItem>
            )
          })}
        </FileUploadList>
      </FileUploadDropzone>

      <div className="pointer-events-none relative z-10 w-full">
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>
  )
}

export default FileUploads
