// lib/api.js
// Single client-side function every tool uses. Handles errors, timeouts, and shape consistently.

export async function generate({ type, prompt, history, signal } = {}) {
  if (!type) throw new Error("generate(): 'type' is required.");
  if (!prompt || !prompt.trim()) throw new Error("generate(): 'prompt' is required.");

  // 60s default timeout
  const controller = signal ? null : new AbortController();
  const timeout = controller ? setTimeout(() => controller.abort(), 60_000) : null;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, prompt, history }),
      signal: signal || controller?.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    return data.content; // the assistant's text
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
