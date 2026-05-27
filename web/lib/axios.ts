import axios from "axios"

export const createAxiosInstance = async () => {
  const isServer = typeof window === "undefined"

  if (isServer) {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()

    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ")

    return axios.create({
      baseURL: process.env.BASE_API_URL,

      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
    })
  }

  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_API_URL,
    withCredentials: true,
    headers: {
      Accept: "application/json",
    },
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        console.log("refresh token interceptor executed!!!")

        try {
          await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/auth/refresh`,
            {},
            { withCredentials: true }
          )

          return instance(originalRequest)
        } catch (error) {
          window.location.href = "/login"
          return Promise.reject(error)
        }
      }

      return Promise.reject(error)
    }
  )

  return instance
}
