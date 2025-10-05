import { deleteSession } from "@/lib/session";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await deleteSession();
    console.log("Session deleted successfully");
    return NextResponse.redirect("/login");
  } catch (e) {
    console.log("Error in signing out");
    return NextResponse.json({ error: "Error in signing out", status: 403 });
  }
}
