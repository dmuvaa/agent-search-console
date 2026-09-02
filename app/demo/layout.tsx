import { headers } from "next/headers";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { DemoWebmcp } from "@/components/webmcp/demo-tools";
import { StoreHeader } from "@/components/demo/store-header";
import { Suspense } from "react";
import { demoToolsForMode, parseWebmcpHeader } from "@/lib/demo/webmcp-mode";

export const metadata: Metadata = {
  title: "NovaShop — fictional demo store",
  description:
    "A fictional electronics catalog built for the Agent Search Console hackathon demo. Not a real shop. Use Off / Partial / Full in the header to stage WebMCP tools.",
};

export default async function DemoLayout({
  children,
}: {
  children: ReactNode;
}) {
  const mode = parseWebmcpHeader((await headers()).get("x-novashop-webmcp"));
  const tools = demoToolsForMode(mode);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f4efe6] text-stone-900">
      {tools.length > 0 ? (
        <script
          id="webmcp-manifest"
          type="application/webmcp+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              name: "NovaShop",
              mode,
              tools,
            }),
          }}
        />
      ) : (
        <script type="application/json" id="webmcp-disabled">
          {JSON.stringify({ webmcp: "off" })}
        </script>
      )}
      <Suspense fallback={null}>
        <StoreHeader mode={mode} />
      </Suspense>
      <DemoWebmcp mode={mode} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
      <footer className="border-t border-stone-300 px-4 py-6 text-sm text-stone-600">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:justify-between">
          <p>NovaShop is a fictional catalog built into this app at /demo. It is not a real store. WebMCP: {mode}.</p>
          <p>Agents cannot complete purchase. A person reviews checkout.</p>
        </div>
      </footer>
    </div>
  );
}
