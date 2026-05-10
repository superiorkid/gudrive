import { NextRequest, NextResponse } from "next/server"

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/" || pathname === "/drive") {
    return NextResponse.redirect(new URL("/drive/home", request.url))
  }

  if (pathname === "/drive/folders") {
    return NextResponse.redirect(new URL("/drive/my-drive", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Exclude API routes, static files, image optimizations, and .png files
    "/((?!api|_next/static|_next/image|.*\\.png$).*)",
  ],
}
