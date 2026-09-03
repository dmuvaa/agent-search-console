import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SeoToolsRunner } from "@/components/seo-tools-runner";
import { SEO_TOOL_PAGES, seoToolBySlug } from "@/lib/seo-tools/catalog";

export function generateStaticParams() {
  return SEO_TOOL_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = seoToolBySlug(slug);
  if (!page) return { title: "SEO tools" };
  return {
    title: `${page.title} — Agent Search Console`,
    description: page.intro,
  };
}

export default async function SeoToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ url?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const page = seoToolBySlug(slug);
  if (!page) notFound();

  const related = SEO_TOOL_PAGES.filter((item) => item.slug !== page.slug).slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        <Link href="/seo" className="hover:underline">
          Technical SEO
        </Link>
        <span className="text-muted"> / {page.slug}</span>
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight">{page.title}</h1>
      <p className="mt-3 max-w-2xl text-xl text-muted">{page.headline}</p>
      <p className="mt-4 max-w-2xl leading-7 text-muted">{page.intro}</p>

      <div className="mt-10">
        <SeoToolsRunner tool={page.name} initialUrl={query.url || ""} />
      </div>

      <section className="mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-medium">What this checks</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
            {page.checks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-medium">Why it matters</h2>
          <p className="mt-4 leading-7 text-muted">{page.why}</p>
          <p className="mt-4 font-mono text-xs text-faint">
            {page.name === "preview_serp_snippet" ? (
              <>
                Included in the full report and available here as a focused preview.
              </>
            ) : (
              <>
                Use this page directly, or call <span className="text-accent">{page.name}</span> through WebMCP with the same URL.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-medium">More SEO tools</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/seo/${item.slug}`}
              className="rounded-xl border border-line bg-card p-4 hover:border-accent/40"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
