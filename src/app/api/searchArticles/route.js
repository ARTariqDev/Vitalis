import OpenAI from "openai";
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { error } from "console";

const openai = new OpenAI({ apiKey: process.env.GPT });

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt");
    if (!prompt) {
      return NextResponse.json(
        { error: "Please enter a prompt and email to get a response." },
        { status: 400 }
      );
    }

    try {
      const userRes = await fetch("/api/user");
      if (userRes.ok) {
        const user = await userRes.json();
        demographic = user.demographics || "";
      }
    } catch (err) {
      demographic = "";
    }
    if (!demographic) {
      return NextResponse.json(
        { error: "Could not fetch demographic for user." },
        { status: 400 }
      );
    }

    // Read data.json from public directory using fs
    const filePath = path.join(process.cwd(), "public", "data.json");
    const fileContents = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContents);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that filters article titles.`,
        },
        {
          role: "user",
          content: `
          ### TASK
          From the list of articles in the json data, select only those that are most relevant to the given demographic and the given prompt.

          ### INPUTS
          Demographic: ${demographic}
          Prompt: ${prompt}
          Data: ${JSON.stringify(data)}

          ### INSTRUCTIONS
          1. Read the data provided (it contains an array of objects where each object represents an article. The object contains title, category tag and a unique number).
          2. Choose only the article object whose title would most likely appeal to the demographic and the prompt which is provided by the user.
          3. If none of the articles are relevant, return an empty array.
          4. Respond **only** with a valid JSON array of objects of the articles — no commentary, no explanations, and no markdown formatting.

          ### OUTPUT FORMAT
          [
          {
            Title: "Title 1",
            Code: "Code 1"
            Tags: "tags"
          }
          {
            Title: "Title 2",
            Code: "Code 2"
            Tags: "tags"
          }
          ]

          If no titles are relevant, output:
          []

          Note: DO NOT CHANGE THE VALUES OF ANY OBJECT
        `,
        },
      ],
      temperature: 0.1,
    });
    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (e) {
    console.log("Error in api/searchArticles \n");
    console.log(e);
    return NextResponse.json({ result: "error!", error: 400 });
  }
}
