import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function readJson<T>(request: Request): Promise<{ ok: true; value: T } | { ok: false; response: ReturnType<typeof fail> }> {
  try {
    return { ok: true, value: (await request.json()) as T };
  } catch {
    return { ok: false, response: fail("VALIDATION", "Invalid JSON body.", 400) };
  }
}

export function isAllowedImage(dataUrl: string) {
  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(dataUrl);
}
