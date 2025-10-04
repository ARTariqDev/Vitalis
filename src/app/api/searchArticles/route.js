import openai from "openai";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt");
  const demographic = searchParams.get("demographic");
  if (!prompt || !demographic) {
    return NextResponse.json(
      { error: "Please enter a prompt and demographic to get a response." },
      { status: 400 }
    );
  }

  const res = await fetch("/data.json");
  const data = await res.json();

  const response = await openai.responses.create({
    apikey: process.env.GPT,
    model: "gpt-4o-mini",
    temperature: 0.1,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
                You are a helpful assistant that filters article titles.

                ### TASK
                From the list of article titles in the json data, select only those that are most relevant to the given demographic and the given prompt.

                ### INPUTS
                Demographic: ${demographic}
                Prompt: ${prompt}
                Data: ${JSON.stringify(data)}

                ### INSTRUCTIONS
                1. Read the data provided (it contains an array of objects of article titles, their category tags and a unique number).
                2. Choose only the article titles that would most likely appeal to the demographic and the prompt which is provided by the user.
                3. If none of the titles are relevant, return an empty array.
                4. Respond **only** with a valid JSON array of strings — no commentary, no explanations, and no markdown formatting.

                ### OUTPUT FORMAT
                [
                "Title 1",
                "Title 2"
                ]

                If no titles are relevant, output:
                []
                `,
          },
        ],
      },
    ],
  });
  console.log(response);
  return NextResponse.json({ result: response.choices[0].message.content });
}
