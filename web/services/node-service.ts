import axiosInstance from "@/lib/axios"
import { ApiResponse } from "@/types/api-response-type"
import { TNode } from "@/types/node-type"
import axios, { AxiosError } from "axios"

export const fetchNodeDetail = async (id: string) => {
  try {
    const response = await axiosInstance(`/v1/nodes/${id}`)
    return response.data as ApiResponse<TNode>
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
  }
}

export const fetchNodes = async (params: { parentId?: string } = {}) => {
  try {
    const response = await axiosInstance("/v1/nodes", {
      params: {
        ...(params.parentId && { parent_id: params.parentId }),
      },
    })
    return response.data as ApiResponse<TNode[]>
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
  }
}
