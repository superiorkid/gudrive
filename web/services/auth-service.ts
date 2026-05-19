import { LoginSchema } from "@/app/(auth)/enter/schema"
import { RegisterSchema } from "@/app/(auth)/register/schema"
import { createAxiosInstance } from "@/lib/axios"
import { ApiResponse } from "@/types/api-response-type"
import { TUser } from "@/types/user-type"
import axios, { AxiosError } from "axios"

export const register = async (payload: RegisterSchema) => {
  const axiosInstance = await createAxiosInstance()

  const { confirmPassword, ...rest } = payload
  try {
    const response = await axiosInstance.post(`/v1/auth/register`, {
      ...rest,
      confirm_password: confirmPassword,
    })
    return response.data as ApiResponse<null>
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

export const login = async (payload: LoginSchema) => {
  const axiosInstance = await createAxiosInstance()

  const formData = new URLSearchParams()
  formData.append("username", payload.email)
  formData.append("password", payload.password)

  try {
    const response = await axiosInstance.post(`/v1/auth/token`, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    return response.data as ApiResponse<{
      access_token: string
      token_type: string
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

export const logout = async () => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.post(`/v1/auth/logout`)
    return response.data as ApiResponse<null>
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

export const getSession = async () => {
  const axiosInstance = await createAxiosInstance()

  try {
    const response = await axiosInstance.get(`/v1/auth/me`)
    return response.data as TUser
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
