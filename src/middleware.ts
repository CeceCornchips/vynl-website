import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth endpoint is always public
  if (pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET ?? "";

  // If the secret isn't configured, block all admin access with a clear error
  if (!secret) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "ADMIN_SESSION_SECRET is not configured." },
        { status: 503 }
      );
    }
    return new NextResponse("Admin not configured — set ADMIN_SESSION_SECRET in .env.local", {
      status: 503,
    });
  }

  const cookie = req.cookies.get(COOKIE_NAME);
  let valid = false;
  try {
    valid = await verifySession(cookie?.value, secret);
  } catch (err) {
    console.error("[middleware] session verification error:", err);
  }

  // Redirect already-authenticated users away from the login page
  if (pathname === "/admin/login") {
    if (valid) {
      return NextResponse.redirect(new URL("/admin/waitlist", req.url));
    }
    return NextResponse.next();
  }

  if (!valid) {
    // API routes → 401 JSON (client handles redirect)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    // Page routes → redirect to login
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
