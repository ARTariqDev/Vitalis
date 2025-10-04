import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/session";

export async function GET(req) {
  try {
    // Get user email from query param or session (for demo, use query param)
    const cookieStore = await cookies();
    const session = cookieStore.get("session");
    const data = session ? await verifyJWT(session.value) : null;
    if (!data) return NextResponse.redirect(new URL("/login", req.url));
    console.log("cookie data", data);
    return NextResponse.json(
      data
      // fullName: user.fullName,
      // email: user.email,
      // demographics: user.demographics,
      // createdAt: user.createdAt,
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
