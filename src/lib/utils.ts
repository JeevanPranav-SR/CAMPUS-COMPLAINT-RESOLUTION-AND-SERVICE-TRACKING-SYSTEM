import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function formatRelative(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const delta = Date.now() - date.getTime();
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export type SlaKind = "met" | "missed" | "ontrack" | "risk" | "breached";

function asDate(value: string | Date) {
  return typeof value === "string" ? new Date(value) : value;
}

function formatDuration(ms: number) {
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function slaState(dueAt: string | Date, status: string, resolvedAt?: string | Date | null): SlaKind {
  const due = asDate(dueAt).getTime();
  if (["RESOLVED", "CLOSED"].includes(status)) {
    const done = resolvedAt ? asDate(resolvedAt).getTime() : Date.now();
    return done <= due ? "met" : "missed";
  }
  const remaining = due - Date.now();
  if (remaining < 0) return "breached";
  if (remaining < 1000 * 60 * 60 * 4) return "risk";
  return "ontrack";
}

export function remainingLabel(dueAt: string | Date, status?: string, resolvedAt?: string | Date | null) {
  const due = asDate(dueAt).getTime();
  if (status && ["RESOLVED", "CLOSED"].includes(status)) {
    const done = resolvedAt ? asDate(resolvedAt).getTime() : Date.now();
    if (done <= due) return "SLA met";
    return `SLA missed by ${formatDuration(done - due)}`;
  }
  const remaining = due - Date.now();
  if (remaining < 0) return `Overdue by ${formatDuration(remaining)}`;
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  if (hours > 48) return `${Math.round(hours / 24)}d remaining`;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m remaining`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
