import axios from "axios"

const isServer = typeof window === "undefined"

const axiosInstance = axios.create({
  baseURL: process.env.BASE_API_URL,
  withCredentials: true, // for client-side cookies
  headers: {
    Accept: "application/json",
  },
})

// request interceptors
axiosInstance.interceptors.request.use(
  async (config) => {
    if (isServer) {
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      const token = cookieStore.get("access-token")?.value

      if (token) {
        config.headers?.set?.("Cookie", `access-token=${token}`)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// response passthrough
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default axiosInstance
