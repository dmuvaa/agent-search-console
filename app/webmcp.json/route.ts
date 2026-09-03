import { WEBMCP_MANIFEST } from "@/lib/webmcp/catalog";

export const dynamic = "force-static";

export function GET() {
  return Response.json(WEBMCP_MANIFEST, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
