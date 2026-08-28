"use client";

import { useEffect, useState } from "react";
import { Card, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { ClientGuard } from "@/components/auth/guards";
import { api } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
  actor: { name: string; email: string; role: string } | null;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ logs: AuditRow[]; total: number }>("/api/audit")
      .then((payload) => {
        setLogs(payload.logs);
        setTotal(payload.total);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!logs.length && !error && total === 0) {
    return (
      <div>
        <PageHeader title="Audit logs" description="Role changes and complaint actions across the system." />
        <Card>
          <p className="text-sm text-[var(--muted)]">No audit events yet.</p>
        </Card>
      </div>
    );
  }
  if (!logs.length && !error) return <Skeleton className="h-96" />;

  return (
    <ClientGuard permission="audit:view">
    <div>
      <PageHeader title="Audit logs" description={`${total} recorded administrative and complaint actions.`} />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[var(--bg)] text-xs text-[var(--muted)]">
            <tr>
              {["When", "Actor", "Action", "Detail"].map((col) => (
                <th key={col} className="px-4 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 text-xs text-[var(--muted)]">{formatDateTime(log.createdAt)}</td>
                <td className="px-4 py-3">{log.actor?.name ?? "System"}</td>
                <td className="px-4 py-3 font-medium">{log.action.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{log.detail ?? log.entity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
    </ClientGuard>
  );
}
