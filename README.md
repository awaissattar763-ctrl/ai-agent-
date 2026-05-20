# AI Agent — Next.js + Groq

Multi-tool AI assistant: Chat, Email, Summary, Planner, Translate, Code.
Powered by **Llama 3.3 70B Versatile** on Groq.

## Stack
- Next.js 14 (App Router)
- Server-side Groq API route (key never exposed to the browser)
- `react-markdown` + `react-syntax-highlighter` for rendering

## Setup

```bash
# 1. Install deps
npm install

# 2. Add your Groq API key
cp .env.local.example .env.local
# then edit .env.local and paste your key

# 3. Run dev server
npm run dev
```

Open http://localhost:3000.

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: New Project → import the repo.
3. Add Environment Variable: `GROQ_API_KEY` = your Groq key.
4. Deploy. That's it.

## Project Structure

```
app/
├── api/generate/route.js   # Server-side Groq endpoint
├── layout.jsx              # Root layout
└── page.jsx                # The UI (Chat, Email, Summary, Planner, Translate, Code)

components/
├── Markdown.jsx            # Markdown renderer w/ syntax highlighting
└── CopyButton.jsx          # Reusable copy-to-clipboard button

lib/
├── prompts.js              # System prompts per tool — edit here to tune behavior
└── api.js                  # Client-side fetch wrapper (timeouts, error handling)
```

## How a tool call works

1. UI calls `generate({ type: "email", prompt: "..." })` from `lib/api.js`.
2. That POSTs `{ type, prompt }` to `/api/generate`.
3. The route looks up the matching system prompt in `lib/prompts.js`.
4. It calls Groq with `model: "llama-3.3-70b-versatile"` server-side.
5. Returns `{ content }` to the client, which renders it as markdown.

## Adding a new tool

1. Add a system prompt to `SYSTEM_PROMPTS` in `lib/prompts.js`.
2. Add a tab to the `TABS` array in `app/page.jsx`.
3. Add a `{tab === "newtool" && ...}` block that calls `runTool({ type: "newtool", ... })`.

That's it.
