import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  console.log("Session Cookie:", sessionCookie);

  // This is the recommended approach to optimistically redirect users
  // We recommend handling auth checks in each page/route
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/policies/:path*",
    "/claims/:path*",
    "/documents/:path*",
    "/commissions/:path*",
    "/leads/:path*",
    "/users/:path*",
  ], // Specify the routes the middleware applies to
};
