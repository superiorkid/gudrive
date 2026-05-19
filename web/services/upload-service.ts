import { createAxiosInstance } from "@/lib/axios"
import { ApiResponse } from "@/types/api-response-type"
import axios, { AxiosError } from "axios"

export async function initializeUpload(params: {
  folderId?: string
  fileName: string
  fileSize: number
  mimeType: string
}) {
  const axiosInstance = await createAxiosInstance()
  try {
    const response = await axiosInstance.post("/v1/uploads/initialize", {
      parent_id: params.folderId,
      filename: params.fileName,
      total_size: params.fileSize,
      mime_type: params.mimeType,
    })
    return response.data as ApiResponse<{
      upload_id: string
      chunk_size: number
    }>
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      console.error("API Error Status:", axiosError.response?.status)
      console.error("Server Data:", axiosError.response?.data)
    } else if (error instanceof Error) {
      console.error("Native Erro:", error.message)
    } else {
      console.error("Unexpected Error:", error)
    }
    throw error
  }
}

export async function uploadChunk(params: {
  uploadId: string
  chunk: Blob
  offset: number
  signal?: AbortSignal
}) {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.put(
      `/v1/uploads/${params.uploadId}/chunks`,
      params.chunk,
      {
        signal: params.signal,
        headers: {
          "Upload-Offset": String(params.offset),
          "Content-Type": "application/octet-stream",
        },
      }
    )
    return response.data as ApiResponse<{ received: number; offset: number }>
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      console.error("API Error Status:", axiosError.response?.status)
      console.error("Server Data:", axiosError.response?.data)
    } else if (error instanceof Error) {
      console.error("Native Erro:", error.message)
    } else {
      console.error("Unexpected Error:", error)
    }
    throw error
  }
}

export async function getUploadOffset(params: { uploadId: string }) {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.head(`/v1/uploads/${params.uploadId}`)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      console.error("API Error Status:", axiosError.response?.status)
      console.error("Server Data:", axiosError.response?.data)
    } else if (error instanceof Error) {
      console.error("Native Erro:", error.message)
    } else {
      console.error("Unexpected Error:", error)
    }
    throw error
  }
}

export async function completeUpload(params: { uploadId: string }) {
  const axiosInstance = await createAxiosInstance()

  try {
    await axiosInstance.post(`/v1/uploads/${params.uploadId}/complete`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      console.error("API Error Status:", axiosError.response?.status)
      console.error("Server Data:", axiosError.response?.data)
    } else if (error instanceof Error) {
      console.error("Native Erro:", error.message)
    } else {
      console.error("Unexpected Error:", error)
    }

    throw error
  }
}
