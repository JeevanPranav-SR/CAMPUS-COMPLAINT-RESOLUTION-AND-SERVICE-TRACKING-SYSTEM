import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    registerNo?: string;
    department?: string;
    hostel?: string;
  };

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }

  const email = body.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email,
      passwordHash: await hashPassword(body.password),
      role: "STUDENT",
      registerNo: body.registerNo || null,
      department: body.department || null,
      hostel: body.hostel || null,
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
  return NextResponse.json({ user: session });
}
