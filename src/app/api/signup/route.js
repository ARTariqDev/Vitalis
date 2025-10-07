import clientPromise from "../_db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import paperNode from "@/app/components/paperNode";

export async function POST(req) {
  try {
    const body = await req.json();
    const { fullName, email, password, demographics } = body;
    if (!fullName || !email || !password || !demographics) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");
    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      fullName,
      email,
      password: hashedPassword,
      demographics,
      paperNodes: [],
      edges: [],
      createdAt: new Date(),
    };
    await users.insertOne(user);
    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
