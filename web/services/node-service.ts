import { TUpdateNodeSchema } from "@/app/(dashboard)/schema"
import { createAxiosInstance } from "@/lib/axios"
import { ApiResponse } from "@/types/api-response-type"
import { TNode } from "@/types/node-type"
import axios, { AxiosError } from "axios"

export const fetchNodeDetail = async (id: string) => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.get(`/v1/nodes/${id}`)
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

    throw error
  }
}

export const fetchNodes = async (
  params: {
    parentId?: string
    keyword?: string
    type?: string
    modified?: string
    folderGroup?: string
    sortDirection?: string
    sortBy?: string
    status?: "active" | "trashed"
    scope?: "normal" | "starred"
  } = {
    folderGroup: "top",
    sortDirection: "asc",
    sortBy: "name",
    status: "active",
    scope: "normal",
  }
) => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.get("/v1/nodes", {
      params: {
        ...(params.parentId && { parent_id: params.parentId }),
        ...(params.type && { type: params.type }),
        ...(params.modified && { modified: params.modified }),
        ...(params.folderGroup && { folder_group: params.folderGroup }),
        ...(params.sortDirection && { sort_direction: params.sortDirection }),
        ...(params.sortBy && { sort_by: params.sortBy }),
        ...(params.status && { status: params.status }),
        ...(params.keyword && { keyword: params.keyword }),
        ...(params.scope && { scope: params.scope }),
      },
    })
    return response.data as ApiResponse<TNode[]>
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      console.error("API Error Status:", axiosError.response?.status)
      console.error("Server Data:", axiosError.response?.data)
    } else if (error instanceof Error) {
      console.error("Native Error:", error.message)
    } else {
      console.error("Unexpected Error:", error)
    }

    throw error
  }
}

export const createNode = async (params: {
  name: string
  parentId?: string
}) => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.post("/v1/nodes", {
      name: params.name,
      parent_id: params.parentId ?? null,
    })
    return response.data as ApiResponse<{
      id: string
      name: string
      type: "file" | "folder"
      parent_id?: string
      created_at: Date
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

export const deleteNode = async (nodeId: string) => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.delete(`/v1/nodes/${nodeId}`)
    return response.data as ApiResponse<{ ok: boolean }>
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

export const restoreNode = async (nodeId: string) => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.post(`/v1/nodes/${nodeId}/restore`)
    return response.data as ApiResponse<{ ok: boolean }>
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

export const toggleStar = async (nodeId: string) => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.post(`/v1/nodes/${nodeId}/starred`)
    return response.data as ApiResponse<{
      node_id: string
      is_starred: boolean
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

export const updateNode = async (params: {
  nodeId: string
  payload: TUpdateNodeSchema
}) => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.put(`/v1/nodes/${params.nodeId}`, {
      name: params.payload.newName,
    })
    return response.data as ApiResponse<{
      id: string
      name: string
      parent_id?: string
      type: "folder" | "file"
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
