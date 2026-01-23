import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSessionToken(req: NextRequest) {
  return (
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    null
  );
}

export function middleware(req: NextRequest) {
  const sessionToken = getSessionToken(req);

  if (!sessionToken) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = "/auth/signin";
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/owner/:path*", "/admin/:path*"],
};
