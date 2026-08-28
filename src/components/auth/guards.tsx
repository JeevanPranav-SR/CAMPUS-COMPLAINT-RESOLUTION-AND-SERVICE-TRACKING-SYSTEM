"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/session";
import { can, canAny, hasPermission, type Permission } from "@/lib/rbac";

const UserContext = createContext<SessionUser | null>(null);

export function UserProvider({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

export function usePermission(permission: Permission) {
  const user = useUser();
  return can(user, permission);
}

export function PermissionGate({
  permission,
  any,
  children,
  fallback = null,
}: {
  permission?: Permission;
  any?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const user = useUser();
  if (!user) return fallback;
  if (permission && !hasPermission(user.role, permission)) return fallback;
  if (any && !canAny(user, any)) return fallback;
  return children;
}

export function ClientGuard({
  permission,
  any,
  children,
}: {
  permission?: Permission;
  any?: Permission[];
  children: React.ReactNode;
}) {
  const user = useUser();
  const router = useRouter();
  const allowed = permission ? can(user, permission) : canAny(user, any ?? []);

  useEffect(() => {
    if (user && !allowed) router.replace("/dashboard");
  }, [user, allowed, router]);

  if (!user || !allowed) return null;
  return children;
}
