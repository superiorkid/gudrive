import { NextRequest, NextResponse } from "next/server"

const AUTH_ROUTES = ["/enter", "/register"]
const PUBLIC_ROUTES = [...AUTH_ROUTES]

export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  const access_token = request.cookies.get("access-token")?.value
  const isAuthenticated = Boolean(access_token)
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/enter", request.url)
    loginUrl.searchParams.set("redirect", pathname)
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

    const display = searchParams.get("display")
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
