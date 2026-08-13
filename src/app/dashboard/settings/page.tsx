"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";

type Account = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  hostel: string | null;
  phone: string | null;
  notifyInApp: boolean;
};

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hostel, setHostel] = useState("");
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    api<{ user: Account }>("/api/account")
      .then((payload) => {
        setUser(payload.user);
        setName(payload.user.name);
        setPhone(payload.user.phone ?? "");
        setHostel(payload.user.hostel ?? "");
        setNotifyInApp(payload.user.notifyInApp);
        setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ name, phone, hostel, notifyInApp }),
      });
      toast("Profile updated.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to save", "error");
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      toast("Password updated.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to update password", "error");
    }
  }

  function applyTheme(next: string) {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("campus-theme", next);
  }

  if (error) return <ErrorState message={error} />;
  if (!user) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Profile, password, notifications and appearance." />
      <form onSubmit={saveProfile} className="space-y-4">
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Profile</h2>
          <Field label="Name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={user.email} disabled />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
          <Field label="Hostel / block">
            <Input value={hostel} onChange={(event) => setHostel(event.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notifyInApp} onChange={(event) => setNotifyInApp(event.target.checked)} />
            In-app notifications
          </label>
          <Button type="submit">Save profile</Button>
        </Card>
      </form>
      <form onSubmit={savePassword} className="mt-4">
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Password</h2>
          <Field label="Current password">
            <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </Field>
          <Field label="New password">
            <Input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          </Field>
          <Button type="submit">Update password</Button>
        </Card>
      </form>
      <Card className="mt-4 space-y-3">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <div className="flex gap-2">
          <Button type="button" variant={theme === "light" ? "primary" : "secondary"} onClick={() => applyTheme("light")}>
            Light
          </Button>
          <Button type="button" variant={theme === "dark" ? "primary" : "secondary"} onClick={() => applyTheme("dark")}>
            Dark
          </Button>
        </div>
      </Card>
    </div>
  );
}
