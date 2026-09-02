"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAudit } from "@/lib/audit-session";

const STAGES = [
  "Fetching website…",
  "Analyzing structure…",
  "Detecting workflows…",
  "Inspecting WebMCP…",
  "Calculating score…",
  "Generating recommendations…",
];

export function AnalyzeRunner() {
  const params = useSearchParams();
  const router = useRouter();
  const url = params.get("url") || "";
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, STAGES.length - 1));
    }, 900);

    async function run() {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Analysis failed");
        if (cancelled) return;
        saveAudit(data);
        setStage(STAGES.length - 1);
        router.replace("/dashboard");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        window.clearInterval(timer);
      }
    }

    void run();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [url, router]);

  if (!url) {
    return <p className="text-muted">Enter a URL to start an analysis.</p>;
  }

  return (
    <div className="rounded-xl border border-line bg-card p-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Analysis</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Reading {url}</h1>
      {error ? (
        <p className="mt-6 rounded-md border border-critical/40 bg-critical/10 px-4 py-3 text-sm text-critical">
          {error}
        </p>
      ) : (
        <ol className="mt-8 space-y-3">
          {STAGES.map((label, index) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  index <= stage ? "bg-accent" : "bg-line"
                }`}
              />
              <span className={index <= stage ? "text-foreground" : "text-muted"}>{label}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
