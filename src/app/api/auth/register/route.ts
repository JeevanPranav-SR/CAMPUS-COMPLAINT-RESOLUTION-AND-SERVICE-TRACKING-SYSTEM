import { fail, ok, readJson } from "@/lib/http";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const parsed = await readJson<{
    name?: string;
    email?: string;
    password?: string;
    registerNo?: string;
    department?: string;
    hostel?: string;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  if (!body.name?.trim() || !body.email || !body.password) {
    return fail("VALIDATION", "Name, email and password are required.", 400);
  }
  if (body.password.length < 8) return fail("VALIDATION", "Password must be at least 8 characters.", 400);
  const email = body.email.toLowerCase().trim();
  if (!email.endsWith("@bitsathy.in")) {
    return fail("VALIDATION", "Student accounts must use your college mail ID (@bitsathy.in).", 400);
  }
  if (body.name.trim().length < 3 || body.name.trim().length > 80) {
    return fail("VALIDATION", "Name must be between 3 and 80 characters.", 400);
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return fail("CONFLICT", "An account with this email already exists.", 409);

  const user = await prisma.user.create({
    data: {
      name: body.name.trim(),
      email,
      passwordHash: await hashPassword(body.password),
      role: "STUDENT",
      registerNo: body.registerNo?.trim() || null,
      department: body.department || null,
      hostel: body.hostel?.trim() || null,
    },
  });

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "STUDENT" as const,
    department: user.department,
    hostel: user.hostel,
    registerNo: user.registerNo,
  };
  await createSession(session);
  return ok({ user: session }, 201);
}
