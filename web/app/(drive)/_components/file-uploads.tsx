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
import axiosInstance from "@/lib/axios"
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

      const res = await axiosInstance.put(
        `/v1/uploads/${control.uploadId}/chunks`,
        chunk,
        {
          signal: controller.signal,
          headers: {
            "Upload-Offset": String(control.offset),
            "Content-Type": "application/octet-stream",
          },
        }
      )
      control.offset = res.data.data.offset
      const progress = (control.offset / file.size) * 100
      onProgress(file, progress)
    }

    await axiosInstance.post(`/v1/uploads/${control.uploadId}/complete`)
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
                const initRes = await axiosInstance.post(
                  "/v1/uploads/initialize",
                  {
                    parent_id: folderId,
                    filename: file.name,
                    total_size: file.size,
                  }
                )
                const { upload_id, chunk_size } = initRes.data.data

                control = {
                  offset: 0,
                  uploadId: upload_id,
                  status: "uploading",
                  chunkSize: chunk_size,
                }
                uploadsRef.current.set(key, control)
                syncState(key, control)
              }

              const headRes = await axiosInstance.head(
                `/v1/uploads/${control.uploadId}`
              )
              control.offset = Number(headRes.headers["upload-offset"] || 0)

              await continueUpload(file, control, onProgress)
              control.status = "completed"
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
      const headRes = await axiosInstance.head(
        `/v1/uploads/${control.uploadId}`
      )

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
    <FileUpload
      value={files}
      onValueChange={setFiles}
      onUpload={onUpload}
      onFileReject={onFileReject}
      multiple
    >
      <FileUploadDropzone className="aspect-video bg-background p-0 data-dragging:border-sky-400 data-dragging:bg-sky-100">
        {children}
      </FileUploadDropzone>
      <FileUploadList className="absolute right-2 bottom-2">
        {files.map((file, index) => {
          const key = `${file.name}-${file.size}`
          const control = uploadStates[key]

          return (
            <FileUploadItem key={index} value={file} className="flex-col">
              <div className="flex w-full items-center gap-2">
                <FileUploadItemPreview />
                <FileUploadItemMetadata />

                <ButtonGroup>
                  {control?.status === "uploading" && (
                    <Button onClick={() => pauseUpload(file)} size="icon">
                      <PauseIcon />
                    </Button>
                  )}
                  {control?.status === "paused" && (
                    <Button onClick={() => resumeUpload(file)} size="icon">
                      <PlayIcon />
                    </Button>
                  )}

                  {control?.status === "error" && (
                    <Button onClick={() => resumeUpload(file)} size="icon">
                      <PlayIcon />
                    </Button>
                  )}

                  <FileUploadItemDelete asChild>
                    <Button size="icon" variant="destructive">
                      <XIcon />
                    </Button>
                  </FileUploadItemDelete>
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
