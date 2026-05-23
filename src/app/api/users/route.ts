import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    const mappedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === "ADMIN" ? "Administrator" : "Kasir / Cashier",
      roleColor:
        user.role === "ADMIN"
          ? "bg-blue-50 text-blue-700 border-blue-100/60"
          : "bg-emerald-50 text-emerald-700 border-emerald-100",
    }));

    return NextResponse.json(mappedUsers);
  } catch (error: any) {
    console.error("GET Users API Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data staff" },
      { status: 500 }
    );
  }
}

// POST create user
export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi!" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar!" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: role === "ADMIN" ? "ADMIN" : "CASHIER",
      },
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role === "ADMIN" ? "Administrator" : "Kasir / Cashier",
    });
  } catch (error: any) {
    console.error("POST User API Error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data staff" },
      { status: 500 }
    );
  }
}
