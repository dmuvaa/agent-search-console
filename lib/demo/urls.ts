import type { DemoWebmcpMode } from "@/lib/demo/webmcp-mode";

export function withWebmcp(href: string, mode: DemoWebmcpMode) {
  const [path, hash] = href.split("#");
  const url = new URL(path, "https://novashop.local");
  if (mode === "off") {
    url.searchParams.delete("webmcp");
  } else {
    url.searchParams.set("webmcp", mode);
  }
  return `${url.pathname}${url.search}${hash ? `#${hash}` : ""}`;
}
