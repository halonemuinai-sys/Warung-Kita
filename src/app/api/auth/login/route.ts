import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username/Email dan Password wajib diisi!" },
        { status: 400 }
      );
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Query user by email or name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanUser, mode: 'insensitive' } },
          { name: { equals: username.trim(), mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Username/Email atau password salah!" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(cleanPass, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Username/Email atau password salah!" },
        { status: 401 }
      );
    }

    // Return user info (role mapped to 'Owner' or 'Kasir' to match frontend)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === 'ADMIN' ? 'Owner' : 'Kasir',
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
