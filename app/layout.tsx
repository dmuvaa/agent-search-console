import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    "Audit any public website for AI-agent readiness, score WebMCP coverage, and generate starter tools.",
  openGraph: {
    title: "Agent Search Console — SEO for the Agentic Web",
    description: "Paste a live URL. Measure whether AI agents can operate the site through WebMCP tools.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
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
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <WebMcpRuntime />
        <ConsoleWebmcp />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
