export function safeDashboardPath(next: string | null | undefined) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/dashboard")) return "/dashboard";
  if (next.startsWith("//") || next.includes("://") || next.includes("\\") || next.includes("..")) {
    return "/dashboard";
  }
  return next;
}
