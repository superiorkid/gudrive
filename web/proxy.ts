import { NextRequest, NextResponse } from "next/server"

export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

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

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-url", request.url)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    // Exclude API routes, static files, image optimizations, and .png files
    "/((?!api|_next/static|_next/image|.*\\.png$).*)",
  ],
}
