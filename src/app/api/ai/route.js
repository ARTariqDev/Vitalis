import { NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

function getModelResponse(data) {
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

export async function POST(request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const { prompt, temperature = 0.3, json = false } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Vitalis",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_GEMINI_MODEL || DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenRouter request failed." },
        { status: response.status }
      );
    }

    return NextResponse.json({ result: getModelResponse(data) });
  } catch (error) {
    console.error("[api/ai] OpenRouter request failed:", error);
    return NextResponse.json(
      { error: "Unable to generate an AI response." },
      { status: 500 }
    );
  }
}