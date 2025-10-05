// import clientPromise from "../_db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { id, position } = await req.json();
    if (!id || !position) {
      return NextResponse.json(
        { error: "Missing id or position" },
        { status: 400 }
      );
    }
    const client = await clientPromise;
    // const db = client.db();
    const nodes = db.collection("nodes");
    // Update the node's position in the database
    await nodes.updateOne({ id }, { $set: { position } }, { upsert: true });
    return NextResponse.json({ message: "Node position updated" });
  } catch (err) {
    console.error("Error updating node position:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
