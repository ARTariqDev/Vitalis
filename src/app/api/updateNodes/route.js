// import clientPromise from "../_db";
import { NextResponse } from "next/server";
import clientPromise from "../_db";
import { verifyJWT } from "@/lib/session";

export async function POST(request) {
  try {
    const { paperNodes, edges } = await request.json();
    if (!paperNodes || !edges) {
      return NextResponse.json(
        { error: "Missing nodes or edges" },
        { status: 400 }
      );
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");
    const session = request.cookies.get("session").value;
    const { email } = await verifyJWT(session);
    if (!session) {
      return NextResponse.redirect("/login");
    }
    console.log(users);
    await users.findOneAndUpdate({ email }, { $set: { paperNodes, edges } });
    console.log("Successfully updated nodes");
    return NextResponse.json({ message: "Node position updated" });
  } catch (err) {
    console.error("Error updating node position:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
