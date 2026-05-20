import { createAxiosInstance } from "@/lib/axios"
import { ApiResponse } from "@/types/api-response-type"
import axios, { AxiosError } from "axios"

export const fetchStatistics = async () => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.get("/v1/statistics/overview")
    return response.data as ApiResponse<{
      total_files: number
      library_size: number
      recent_uploads: number
      starred_items: number
      types: {
        images: number
        videos: number
        documents: number
        audio_other: number
      }
    }>
  } catch (error: unknown) {
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
