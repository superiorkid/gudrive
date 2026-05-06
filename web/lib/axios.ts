import axios from "axios"

const isServer = typeof window === "undefined"

const axiosInstance = axios.create({
  baseURL: isServer
    ? process.env.BASE_API_URL
    : process.env.NEXT_PUBLIC_BASE_API_URL,
  withCredentials: true, // for client-side cookies
  headers: {
    Accept: "application/json",
  },
})

// request interceptors
axiosInstance.interceptors.request.use(async (config) => {
  let token: string | undefined

  if (isServer) {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    token = cookieStore.get("access-token")?.value
  } else {
    token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access-token="))
      ?.split("=")[1]
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// response passthrough
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default axiosInstance
