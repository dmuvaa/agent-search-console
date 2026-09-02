"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AnalyzeForm({
  initialUrl = "",
  compact = false,
}: {
  initialUrl?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    const withScheme = /:\/\//.test(value) ? value : `https://${value}`;
    router.push(`/analyze?url=${encodeURIComponent(withScheme)}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label htmlFor="url" className="sr-only">
        Website URL
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="url"
          name="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="webprismio.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-12 flex-1 rounded-md border border-line bg-[#0c0c0e] px-4 text-foreground outline-none ring-accent/40 placeholder:text-faint focus:ring-2"
        />
        <button
          type="submit"
          className="h-12 rounded-md bg-accent px-5 text-sm font-semibold text-accent-ink hover:bg-accent-2"
        >
          Analyze website
        </button>
      </div>
      {!compact ? (
        <p className="mt-3 text-sm text-muted">
          Try the demo store:{" "}
          <ExampleLink path="/demo" label="off (~51)" />
          {" · "}
          <ExampleLink path="/demo?webmcp=partial" label="partial (~79)" />
          {" · "}
          <ExampleLink path="/demo?webmcp=full" label="full (~99)" />
        </p>
      ) : null}
    </form>
  );
}

function ExampleLink({ path, label }: { path: string; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-accent underline-offset-2 hover:underline"
      onClick={() => {
        const href = `${window.location.origin}${path}`;
        router.push(`/analyze?url=${encodeURIComponent(href)}`);
      }}
    >
      {label}
    </button>
  );
}
