import clientPromise from "../_db";
import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/session";

export async function POST(request) {
  try {
    const { paperData } = await request.json();

    if (!paperData || !paperData.csvTitle) {
      return NextResponse.json(
        { error: "Invalid paper data" },
        { status: 400 }
      );
    }
    const session = request.cookies.get("session").value;
    const { email } = await verifyJWT(session);
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    // Create the paper document
    const paperNode = {
      id: paperData.csvTitle,
      data: { title: paperData.csvTitle },
      position: { x: 100, y: 0 }, // Default position
      type: "paperNode",
      link: paperData.link,
      summary: paperData.summary,
      imageLinks: paperData.imageLinks || [],
      savedAt: new Date(),
    };

    // Check if paper already exists
    const user = await users.findOne({ email });
    const existingPaper = user.paperNodes.find(
      (node) => (node.id = paperNode.id)
    );
    if (existingPaper) {
      return NextResponse.json(
        {
          error: "Paper already saved to journal",
          message: "This paper is already in your journal",
        },
        { status: 409 }
      );
    }

    // Insert the paper
    const result = await users.findOneAndUpdate(
      { email },
      { $push: { paperNodes: paperNode } }
    );

    return NextResponse.json({
      success: true,
      message: "Paper saved successfully",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving paper:", error);
    return NextResponse.json(
      { error: "Failed to save paper", details: error.message },
      { status: 500 }
    );
  }
}
