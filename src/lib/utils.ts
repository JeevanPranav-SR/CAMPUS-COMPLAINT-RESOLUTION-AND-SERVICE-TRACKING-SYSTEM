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

export function slaState(dueAt: string | Date, status: string) {
  if (["RESOLVED", "CLOSED"].includes(status)) return "met" as const;
  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const remaining = due.getTime() - Date.now();
  if (remaining < 0) return "breached" as const;
  if (remaining < 1000 * 60 * 60 * 4) return "risk" as const;
  return "ontrack" as const;
}

export function remainingLabel(dueAt: string | Date) {
  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const remaining = due.getTime() - Date.now();
  if (remaining < 0) {
    const late = Math.abs(remaining);
    const hours = Math.floor(late / 3600000);
    return `${hours}h overdue`;
  }
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  if (hours > 48) return `${Math.round(hours / 24)}d left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
