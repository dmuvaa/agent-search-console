import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConsoleWebmcp } from "@/components/webmcp/console-tools";
import { WebMcpRuntime } from "@/components/webmcp/runtime";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ALL_WEBMCP_TOOLS } from "@/lib/webmcp/catalog";
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
  title: "Agent Search Console — Technical SEO tools",
  description:
    "Indexability, schema, robots.txt, sitemaps, redirects, headers, headings, meta tags, broken links, and SERP snippets. Technical SEO checkers humans and agents can run.",
  openGraph: {
    title: "Agent Search Console — Technical SEO tools",
    description: "Paste a public URL. Run the crawl diagnostics that still decide whether a page can rank.",
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
              tools: ALL_WEBMCP_TOOLS,
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
