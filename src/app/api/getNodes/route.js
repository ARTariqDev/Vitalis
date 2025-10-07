import { NextResponse } from "next/server";
import clientPromise from "../_db";
import { verifyJWT } from "@/lib/session";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");
    const session = request.cookies.get("session").value;
    const { email } = await verifyJWT(session);
    const user = await users.findOne({ email });
    console.log(user);
    if (!user.paperNodes) {
      return NextResponse.json("No nodes availble");
    }
    console.log("Journal data retieved successfully");
    return NextResponse.json({
      paperNodes: user.paperNodes,
      edges: user.edges,
    });
  } catch (e) {
    console.log("Unable to fetch journal data");
    console.log(e);
    return NextResponse.json("server error", { status: 400 });
  }
}
