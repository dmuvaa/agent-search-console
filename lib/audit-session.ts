import type { AuditReport } from "@/types/audit";

export const AUDIT_STORAGE_KEY = "asc.audit.v1";

export function saveAudit(report: AuditReport) {
  sessionStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(report));
  window.dispatchEvent(new Event("asc-audit"));
}

export function loadAudit(): AuditReport | null {
  const raw = sessionStorage.getItem(AUDIT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuditReport;
  } catch {
    return null;
  }
}
