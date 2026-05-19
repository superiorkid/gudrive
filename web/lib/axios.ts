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

  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_API_URL,
    withCredentials: true,
    headers: {
      Accept: "application/json",
    },
  })
}
