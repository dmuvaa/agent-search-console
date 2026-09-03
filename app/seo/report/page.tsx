import type { Metadata } from "next";
import Link from "next/link";
import { SeoReportRunner } from "@/components/seo-report-runner";

export const metadata: Metadata = {
  title: "Technical SEO report for humans and agents — Agent Search Console",
  description:
    "Generate a technical SEO audit with clear scores, findings, raw evidence, and a WebMCP-ready action plan.",
};

export default function SeoReportPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
      <Link href="/seo" className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Technical SEO
      </Link>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight">
        Technical SEO report for humans and agents
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        Generate a full technical SEO audit from one URL. Review clear scores, findings, and raw
        evidence in the browser, while agents get a WebMCP-ready action plan they can use for
        follow-up work.
      </p>

      <div className="mt-10">
        <SeoReportRunner initialUrl="" />
      </div>
    </main>
  );
}
