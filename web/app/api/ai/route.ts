import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { type, context } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  let prompt = "";

  if (type === "announcement") {
    prompt = `You are a gym manager assistant for FitForge Gym. Write a professional, friendly, and motivating gym announcement based on this topic: "${context}".

Requirements:
- Keep it under 150 words
- Warm and energetic tone
- Include a call-to-action if relevant
- No markdown formatting — plain text only
- Do NOT include a subject/title line (just the message body)`;
  } else if (type === "insight") {
    prompt = `You are a gym analytics assistant. Based on this gym data: ${context}

Provide 2-3 short, actionable business insights. Plain text, bullet points using "•", under 100 words total.`;
  } else {
    return NextResponse.json({ error: "Unknown AI type" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || "API error" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Network error" }, { status: 500 });
  }
}
