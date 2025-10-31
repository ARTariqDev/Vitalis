import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

/**
 * Note: Chrome's built-in AI APIs are client-side only.
 * This API route now returns the data and instructions for the client
 * to process using Chrome's Prompt API (Gemini Nano).
 */

export async function GET(request) {
  try {
    console.log("[searchArticles] API called");
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt");

    if (!prompt) {
      console.log("[searchArticles] No prompt provided");
      return NextResponse.json(
        { error: "Please enter a prompt and email to get a response." },
        { status: 400 }
      );
    }

    let demographic = "";
    try {
      console.log("[searchArticles] Fetching user demographic...");
      // Build absolute URL for /api/user using request object
      const baseUrl = request.headers.get("host")
        ? `${
            request.headers.get("x-forwarded-proto") || "http"
          }://${request.headers.get("host")}`
        : "http://localhost:3000";
      const userUrl = `${baseUrl}/api/user`;
      // Forward cookies from the incoming request for authentication
      const cookie = request.headers.get("cookie") || "";
      const userRes = await fetch(userUrl, {
        headers: {
          cookie,
        },
        credentials: "include",
      });
      if (userRes.ok) {
        const user = await userRes.json();
        demographic = user.demographics || "";
        console.log("[searchArticles] Demographic fetched:", demographic);
      } else {
        console.log(
          "[searchArticles] /api/user response not ok:",
          userRes.status
        );
      }
    } catch (err) {
      console.log("[searchArticles] Error fetching /api/user:", err);
      demographic = "";
    }
    if (!demographic) {
      console.log("[searchArticles] Demographic missing");
      return NextResponse.json(
        { error: "Could not fetch demographic for user." },
        { status: 400 }
      );
    }

    // Read data.json from public directory using fs
    let data = [];
    try {
      const filePath = path.join(process.cwd(), "public", "data.json");
      console.log("[searchArticles] Reading data.json at", filePath);
      const fileContents = await fs.readFile(filePath, "utf-8");
      data = JSON.parse(fileContents);
      console.log(
        "[searchArticles] data.json loaded, articles count:",
        Array.isArray(data) ? data.length : Object.keys(data).length
      );
    } catch (err) {
      console.log("[searchArticles] Error reading/parsing data.json:", err);
      return NextResponse.json(
        { error: "Could not read data.json." },
        { status: 500 }
      );
    }

    // Return data to client for processing with Chrome's Prompt API
    console.log("[searchArticles] Returning data for client-side processing");
    return NextResponse.json({
      demographic,
      prompt,
      data,
      instructions: {
        systemPrompt: "You are a helpful assistant that filters article titles.",
        taskPrompt: `
### TASK
From the list of articles in the json data, select only those that are most relevant to the given demographic and the given prompt.

### INPUTS
Demographic: ${demographic}
Prompt: ${prompt}
Data: ${JSON.stringify(data)}

### INSTRUCTIONS
1. Read the data provided (it contains an array of objects where each object represents an article. The object contains title, category tag and a unique number).
2. Choose only the article object whose title would most likely appeal to the demographic and the prompt which is provided by the user.
3. You must return atleast 2 items no matter what.
4. Respond **only** with a valid JSON array of objects of the articles — no commentary, no explanations, and no markdown formatting.
5. Use the following link and incroporate any useful information from here into your summaries: https://science.nasa.gov/biological-physical/data/
The prompt can be of the user asking for any type of article. focus on the prompt and then return the articles based on demographic

### OUTPUT FORMAT
[
{
  "Title": "Title 1",
  "Code": "Code 1",
  "Tags": "tags"
},
{
  "Title": "Title 2",
  "Code": "Code 2",
  "Tags": "tags"
}
]

Note: DO NOT CHANGE THE VALUES OF ANY OBJECT
        `
      }
    });
  } catch (e) {
    console.log("Error in api/searchArticles \n");
    console.log(e);
    return NextResponse.json({ result: "error!", error: 400 });
  }
}
