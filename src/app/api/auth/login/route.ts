import { fail, ok, readJson } from "@/lib/http";
import { loginWithCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const parsed = await readJson<{ email?: string; password?: string }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  if (!body.email || !body.password) {
    return fail("VALIDATION", "Email and password are required.", 400);
  }
  const user = await loginWithCredentials(body.email, body.password);
  if (!user) return fail("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  return ok({ user });
}
