"use client";

import { useEffect, useState } from "react";
import { loadAudit } from "@/lib/audit-session";
import type { AuditReport } from "@/types/audit";

export function useAudit() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setReport(loadAudit());
      setReady(true);
    };
    sync();
    window.addEventListener("asc-audit", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("asc-audit", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { report, ready };
}
