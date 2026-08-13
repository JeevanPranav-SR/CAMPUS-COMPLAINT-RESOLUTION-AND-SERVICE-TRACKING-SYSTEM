"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { api } from "@/lib/client";
import { formatRelative } from "@/lib/utils";
import type { NotificationItem } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

export default function NotificationsPage() {
  const toast = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    api<{ notifications: NotificationItem[] }>("/api/notifications")
      .then((payload) => setItems(payload.notifications))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead() {
    await api("/api/notifications", { method: "PATCH" });
    toast("Notifications marked as read.");
    load();
  }

  if (loading) return <Skeleton className="h-64" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Updates from assignments, status changes and SLA events."
        actions={<Button variant="secondary" onClick={markRead}>Mark all read</Button>}
      />
      {items.length === 0 ? (
        <EmptyState title="You're all caught up." description="Operational updates will appear here." />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className={`rounded-lg border bg-[var(--surface)] p-4 ${item.read ? "border-[var(--border)]" : "border-blue-200"}`}>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-[var(--muted)]">{item.body}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{formatRelative(item.createdAt)}</p>
              {item.complaintId ? (
                <Link href={`/dashboard/complaints/${item.complaintId}`} className="mt-2 inline-block text-sm text-[var(--accent)]">
                  Open complaint
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
