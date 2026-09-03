import { NextResponse } from "next/server";
import { TOOLS_PERMISSIONS_POLICY } from "@/lib/webmcp/agent-access";

export function proxy() {
  const response = NextResponse.next();
  response.headers.set("Permissions-Policy", TOOLS_PERMISSIONS_POLICY);
  response.headers.set("Origin-Agent-Cluster", "?1");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
