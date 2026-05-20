// app/api/generate/route.js
import { NextResponse } from "next/server";
import { SYSTEM_PROMPTS } from "@/lib/prompts";

export const runtime = "edge"; // fast cold starts on Vercel; remove this line if you prefer Node.js runtime

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export async function POST(req) {
  try {
    // ---- 1. Validate env ----
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: GROQ_API_KEY is missing." },
        { status: 500 }
      );
    }

    // ---- 2. Parse + validate input ----
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { type, prompt, history } = body || {};

    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Missing 'type' field." }, { status: 400 });
    }
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Missing 'prompt' field." }, { status: 400 });
    }
    if (prompt.length > 12000) {
      return NextResponse.json(
        { error: "Prompt too long (max 12,000 characters)." },
        { status: 413 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[type];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: `Unknown type '${type}'. Valid: ${Object.keys(SYSTEM_PROMPTS).join(", ")}` },
        { status: 400 }
      );
    }

    // ---- 3. Build messages ----
    // For 'chat' we accept optional conversation history for multi-turn.
    // For one-shot tools (email, summary, etc.) we ignore history.
    const messages = [{ role: "system", content: systemPrompt }];

    if (type === "chat" && Array.isArray(history)) {
      // Sanitize: only keep last 20 valid turns
      const cleaned = history
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string"
        )
        .slice(-20);
      messages.push(...cleaned);
    }

    messages.push({ role: "user", content: prompt });

    // ---- 4. Call Groq ----
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: type === "code" ? 0.3 : 0.7, // tighter for code
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      // Don't leak full upstream errors to the client; log them.
      console.error("[Groq API error]", groqRes.status, errText);
      return NextResponse.json(
        { error: `AI service error (${groqRes.status}). Please try again.` },
        { status: 502 }
      );
    }

    const data = await groqRes.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI." },
        { status: 502 }
      );
    }

    return NextResponse.json({ content, model: MODEL, type });
  } catch (err) {
    console.error("[/api/generate] unexpected:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

// Reject anything that isn't POST cleanly
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
