import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { ConsoleWebmcp } from "@/components/webmcp/console-tools";
import { WebMcpRuntime } from "@/components/webmcp/runtime";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { CONSOLE_TOOLS } from "@/lib/webmcp/catalog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Search Console — SEO for the Agentic Web",
  description:
    "Audit websites for AI-agent readiness, score WebMCP coverage, and simulate whether declared tools cover typical workflows.",
  openGraph: {
    title: "Agent Search Console — SEO for the Agentic Web",
    description:
      "Analyze a site, then flip NovaShop from no tools to full WebMCP. Typical scores: 51 → 79 → 99.",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const area = (await headers()).get("x-app-area");
  const showConsoleTools = area !== "demo";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {showConsoleTools ? (
          <script
            id="webmcp-manifest"
            type="application/webmcp+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                name: "Agent Search Console",
                tools: CONSOLE_TOOLS,
              }),
            }}
          />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <WebMcpRuntime />
        {showConsoleTools ? <ConsoleWebmcp /> : null}
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
