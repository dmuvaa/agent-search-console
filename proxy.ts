import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseWebmcpParam } from "@/lib/demo/webmcp-mode";
import { TOOLS_PERMISSIONS_POLICY } from "@/lib/webmcp/agent-access";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const demo = request.nextUrl.pathname.startsWith("/demo");
  requestHeaders.set("x-app-area", demo ? "demo" : "console");
  if (demo) {
    requestHeaders.set("x-novashop-webmcp", parseWebmcpParam(request.nextUrl.searchParams.get("webmcp")));
  }
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Permissions-Policy", TOOLS_PERMISSIONS_POLICY);
  response.headers.set("Origin-Agent-Cluster", "?1");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
