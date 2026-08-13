type ApiSuccess<T> = { success: true; data: T };
type ApiFail = { success: false; error: { code: string; message: string } };

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFail | null;
  if (!payload || typeof payload !== "object" || !("success" in payload)) {
    throw new Error(response.ok ? "Unexpected response" : "Request failed");
  }
  if (!payload.success) throw new Error(payload.error.message);
  return payload.data;
}
