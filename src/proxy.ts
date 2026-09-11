import { NextResponse, type NextRequest } from "next/server";

// Layouts can't read the request path, so forward it for the login redirect's callbackUrl.
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
