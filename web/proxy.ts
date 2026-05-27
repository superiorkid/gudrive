import { NextRequest, NextResponse } from "next/server"

const AUTH_ROUTES = ["/enter", "/register"]
const PUBLIC_ROUTES = [...AUTH_ROUTES]

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const accessToken = request.cookies.get("access-token")?.value
  const refreshToken = request.cookies.get("refresh-token")?.value

  const isAuthenticated = Boolean(accessToken) || Boolean(refreshToken)

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/enter", request.url)

    loginUrl.searchParams.set("redirect", `${pathname}${search}`)

    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/drive/my-drive", request.url))
  }

  if (pathname === "/" || pathname === "/drive") {
    return NextResponse.redirect(new URL("/drive/home", request.url))
  }

  if (pathname === "/drive/folders") {
    const url = new URL("/drive/my-drive", request.url)

    const display = request.nextUrl.searchParams.get("display")

    if (display) {
      url.searchParams.set("display", display)
    }

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Exclude API routes, static files, image optimizations, and .png files
    "/((?!api|_next/static|_next/image|.*\\.png$).*)",
  ],
}
