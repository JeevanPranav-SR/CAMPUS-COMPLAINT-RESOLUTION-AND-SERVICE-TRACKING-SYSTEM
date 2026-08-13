import { fail, ok } from "@/lib/http";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  return ok({ user });
}
