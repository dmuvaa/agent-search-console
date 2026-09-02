import { Suspense } from "react";
import { AnalyzeForm } from "@/components/analyze-form";
import { AnalyzeRunner } from "@/components/analyze-runner";

export default function AnalyzePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Analyze</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Inspect a public URL</h1>
      <p className="mt-3 max-w-xl text-muted">
        We fetch the page, a few same-origin links, and any declared WebMCP manifest. JavaScript-only apps may be incomplete.
      </p>
      <div className="mt-8">
        <AnalyzeForm compact />
      </div>
      <div className="mt-10">
        <Suspense fallback={<p className="text-muted">Preparing analysis…</p>}>
          <AnalyzeRunner />
        </Suspense>
      </div>
    </main>
  );
}
