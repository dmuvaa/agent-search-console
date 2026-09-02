import { cn } from "@/lib/cn";
import type { CategoryScores, ScoreRating, SiteKind } from "@/types/audit";
import { categoryMeta, siteKindLabel } from "@/lib/scoring/engine";

export function scoreColor(score: number) {
  if (score >= 75) return "var(--good)";
  if (score >= 60) return "var(--accent)";
  if (score >= 40) return "var(--medium)";
  return "var(--critical)";
}

export function ScoreHero({
  score,
  rating,
  host,
  siteKind,
}: {
  score: number;
  rating: ScoreRating;
  host: string;
  siteKind?: SiteKind;
}) {
  const pct = `${Math.max(0, Math.min(100, score))}%`;
  return (
    <section className="rounded-xl border border-line bg-card p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Agent Readiness</p>
      <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{host}</h1>
          <p className="mt-2 max-w-xl text-muted">
            {rating}. Classified as a {siteKind ? siteKindLabel(siteKind).toLowerCase() : "website"}. Each category is worth 20 points; {score} is the total out of 100.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div
            className="score-ring grid h-28 w-28 place-items-center rounded-full p-[7px]"
            style={{ "--ring-color": scoreColor(score), "--ring-pct": pct } as React.CSSProperties}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-card">
              <span className="font-mono text-3xl font-semibold tabular-nums">{score}</span>
            </div>
          </div>
          <div>
            <p className="font-mono text-sm text-muted">/ 100</p>
            <p className="text-lg font-medium">{rating}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryGrid({ categories }: { categories: CategoryScores }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {categoryMeta().map((item) => {
        const value = categories[item.key];
        return (
          <article key={item.key} className="rounded-xl border border-line bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{item.label}</p>
            <p className="mt-2 font-mono text-2xl tabular-nums">
              {value}
              <span className="text-sm text-muted"> / 20</span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{ width: `${(value / 20) * 100}%`, background: scoreColor((value / 20) * 100) }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{item.blurb}</p>
          </article>
        );
      })}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const color =
    severity === "critical"
      ? "text-critical border-critical/40"
      : severity === "high"
        ? "text-high border-high/40"
        : severity === "medium"
          ? "text-medium border-medium/40"
          : "text-low border-low/40";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide", color)}>
      {severity}
    </span>
  );
}
