"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { ClientGuard } from "@/components/auth/guards";
import { ROLE_META, type Role } from "@/lib/constants";
import { SPECIALTIES, specialtyLabel } from "@/lib/specialties";
import { formatDateTime } from "@/lib/utils";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  hostel: string | null;
  specialty: string | null;
  experienceYears: number;
  active: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const payload = await api<{ users: ManagedUser[]; roles: Role[] }>("/api/users");
      setUsers(payload.users);
      setRoles(payload.roles);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(id: string, patch: Partial<ManagedUser>) {
    setBusy(id);
    try {
      await api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      toast("User updated.");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to update user", "error");
    } finally {
      setBusy(null);
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading) return <Skeleton className="h-96" />;

  return (
    <ClientGuard permission="user:manage">
    <div>
      <PageHeader title="Users" description="Assign roles, technician trades and years of experience. AI dispatch uses those to auto-assign work." />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-[var(--bg)] text-xs text-[var(--muted)]">
            <tr>
              {["Name", "Email", "Role", "Trade / experience", "Department", "Status"].map((col) => (
                <th key={col} className="px-4 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((person) => (
              <tr key={person.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3">
                  <p className="font-medium">{person.name}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDateTime(person.createdAt)}</p>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{person.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={person.role}
                    disabled={busy === person.id}
                    onChange={(event) => save(person.id, { role: event.target.value as Role })}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_META[role].label}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3">
                  {person.role === "TECHNICIAN" ? (
                    <div className="flex min-w-[220px] flex-col gap-2">
                      <Select
                        value={person.specialty ?? ""}
                        disabled={busy === person.id}
                        onChange={(event) => save(person.id, { specialty: event.target.value || null })}
                        aria-label={`Trade for ${person.name}`}
                      >
                        <option value="">Select trade</option>
                        {SPECIALTIES.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </Select>
                      <Select
                        value={String(person.experienceYears ?? 0)}
                        disabled={busy === person.id}
                        onChange={(event) => save(person.id, { experienceYears: Number(event.target.value) })}
                        aria-label={`Experience for ${person.name}`}
                      >
                        {Array.from({ length: 21 }, (_, years) => (
                          <option key={years} value={years}>
                            {years} yr{years === 1 ? "" : "s"}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : (
                    <span className="text-[var(--muted)]">{person.specialty ? specialtyLabel(person.specialty) : "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{person.department ?? "—"}</td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant={person.active ? "secondary" : "primary"}
                    disabled={busy === person.id}
                    onClick={() => save(person.id, { active: !person.active })}
                  >
                    {person.active ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
    </ClientGuard>
  );
}
