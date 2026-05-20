// app/page.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import Markdown from "@/components/Markdown";
import CopyButton from "@/components/CopyButton";
import { generate } from "@/lib/api";

// ── localStorage helpers ──
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
const load = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
};

const TABS = [
  { id: "chat", icon: "💬", label: "Chat" },
  { id: "email", icon: "📧", label: "Email" },
  { id: "summary", icon: "📝", label: "Summary" },
  { id: "planner", icon: "✅", label: "Planner" },
  { id: "translate", icon: "🌐", label: "Translate" },
  { id: "code", icon: "💻", label: "Code" },
  { id: "log", icon: "📋", label: "Log" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function Page() {
  // ── Hydration-safe initial state ──
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("MyAgent");
  const [setup, setSetup] = useState(false);
  const [tab, setTab] = useState("chat");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [logs, setLogs] = useState([]);

  const [ePrompt, setEPrompt] = useState("");
  const [eOut, setEOut] = useState("");
  const [eBusy, setEBusy] = useState(false);
  const [eErr, setEErr] = useState("");

  const [sInput, setSInput] = useState("");
  const [sOut, setSOut] = useState("");
  const [sBusy, setSBusy] = useState(false);
  const [sErr, setSErr] = useState("");

  const [pInput, setPInput] = useState("");
  const [pOut, setPOut] = useState("");
  const [pBusy, setPBusy] = useState(false);
  const [pErr, setPErr] = useState("");

  const [tInput, setTInput] = useState("");
  const [tLang, setTLang] = useState("Urdu");
  const [tOut, setTOut] = useState("");
  const [tBusy, setTBusy] = useState(false);
  const [tErr, setTErr] = useState("");

  const [cInput, setCInput] = useState("");
  const [cOut, setCOut] = useState("");
  const [cBusy, setCBusy] = useState(false);
  const [cErr, setCErr] = useState("");

  const endRef = useRef(null);
  const inpRef = useRef(null);

  // ── Hydrate from localStorage AFTER mount (avoids SSR mismatch) ──
  useEffect(() => {
    setName(load("aname", "MyAgent"));
    setSetup(load("asetup", false));
    setMsgs(load("amsgs", []));
    setLogs(load("alogs", []));
    setMobile(window.innerWidth < 700);
    setHydrated(true);
  }, []);

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 700);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);
  useEffect(() => {
    if (hydrated) save("amsgs", msgs.slice(-80));
  }, [msgs, hydrated]);
  useEffect(() => {
    if (hydrated) save("alogs", logs.slice(-40));
  }, [logs, hydrated]);

  const addLog = (t) =>
    setLogs((p) => [
      { time: new Date().toLocaleTimeString(), text: t },
      ...p.slice(0, 39),
    ]);

  // ── Chat (multi-turn) ──
  const sendMsg = async () => {
    if (!input.trim() || busy) return;
    const txt = input.trim();
    const next = [...msgs, { role: "user", text: txt }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    if (mobile) setSidebar(false);

    try {
      const history = msgs.map((m) => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.text,
      }));
      const reply = await generate({ type: "chat", prompt: txt, history });
      setMsgs((p) => [...p, { role: "agent", text: reply }]);
      addLog(`💬 "${txt.slice(0, 35)}${txt.length > 35 ? "..." : ""}"`);
    } catch (e) {
      setMsgs((p) => [
        ...p,
        { role: "agent", text: `❌ ${e.message}`, error: true },
      ]);
    }
    setBusy(false);
    setTimeout(() => inpRef.current?.focus(), 100);
  };

  // ── Reusable one-shot tool runner ──
  const runTool = async ({
    type,
    prompt,
    setBusyFn,
    setOut,
    setErr,
    logMsg,
  }) => {
    if (!prompt.trim()) {
      setErr("Please enter some input first.");
      return;
    }
    setBusyFn(true);
    setErr("");
    setOut("");
    try {
      const result = await generate({ type, prompt });
      setOut(result);
      addLog(logMsg);
    } catch (e) {
      setErr(e.message);
    }
    setBusyFn(false);
  };

  // Don't flicker pre-hydration
  if (!hydrated) {
    return <div style={css.bg} />;
  }

  // ── SETUP ──
  if (!setup)
    return (
      <div style={css.bg}>
        <div style={css.card}>
          <div style={{ fontSize: 52, textAlign: "center", marginBottom: 8 }}>
            🤖
          </div>
          <h1 style={css.h1}>AI Agent</h1>
          <p style={css.sub}>Powered by Groq AI — Ultra Fast & Free!</p>

          <div style={{ marginBottom: 16 }}>
            <label style={css.lbl}>Your Agent's Name</label>
            <input
              style={css.inp}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MyAgent"
            />
          </div>

          <button
            style={css.launch}
            onClick={() => {
              save("aname", name);
              save("asetup", true);
              setSetup(true);
              addLog("Agent started ✅");
            }}
          >
            🚀 Launch Agent
          </button>

          <div style={css.features}>
            <span style={css.feat}>💬 Chat</span>
            <span style={css.feat}>📧 Email</span>
            <span style={css.feat}>📝 Summary</span>
            <span style={css.feat}>✅ Planner</span>
            <span style={css.feat}>🌐 Translate</span>
            <span style={css.feat}>💻 Code</span>
          </div>
        </div>
      </div>
    );

  // ── MAIN APP ──
  return (
    <div style={css.root}>
      {mobile && sidebar && (
        <div style={css.overlay} onClick={() => setSidebar(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          ...css.side,
          ...(mobile
            ? {
                position: "fixed",
                left: sidebar ? 0 : -220,
                top: 0,
                zIndex: 200,
                transition: "left 0.25s",
              }
            : {}),
        }}
      >
        <div style={css.sHead}>
          <div style={{ fontSize: 22 }}>🤖</div>
          <div style={css.sName}>{name}</div>
        </div>
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              style={{ ...css.nBtn, ...(tab === t.id ? css.nAct : {}) }}
              onClick={() => {
                setTab(t.id);
                if (mobile) setSidebar(false);
              }}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{t.label}</span>
              {t.id === "log" && logs.length > 0 && (
                <span style={css.bdg}>{logs.length}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main style={css.main}>
        <header style={css.top}>
          {mobile && (
            <button style={css.smB} onClick={() => setSidebar(true)}>
              ☰
            </button>
          )}
          <div style={css.topT}>
            {TABS.find((t) => t.id === tab)?.icon}{" "}
            {TABS.find((t) => t.id === tab)?.label}
          </div>
        </header>

        {/* CHAT */}
        {tab === "chat" && (
          <>
            <div style={css.msgArea}>
              {msgs.length === 0 && (
                <div style={css.empty}>
                  <div style={{ fontSize: 48 }}>💬</div>
                  <p style={{ color: "#64748b", fontSize: 14 }}>
                    Start a conversation with your agent
                  </p>
                </div>
              )}
              {msgs.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      ...css.bub,
                      ...(m.role === "user" ? css.uBub : css.aBub),
                      ...(m.error ? { borderColor: "#ef4444" } : {}),
                    }}
                  >
                    {m.role === "user" ? (
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                    ) : (
                      <Markdown>{m.text}</Markdown>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ ...css.bub, ...css.aBub }}>
                    <span style={{ color: "#64748b" }}>⏳ Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div style={css.cBar}>
              <textarea
                ref={inpRef}
                style={css.cTA}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMsg();
                  }
                }}
                placeholder="Type a message…"
                rows={1}
              />
              <button
                style={{
                  ...css.launch,
                  width: "auto",
                  padding: "10px 18px",
                  opacity: busy || !input.trim() ? 0.5 : 1,
                }}
                onClick={sendMsg}
                disabled={busy || !input.trim()}
              >
                {busy ? "⏳" : "Send"}
              </button>
            </div>
          </>
        )}

        {/* EMAIL */}
        {tab === "email" && (
          <TP>
            <L>Describe the email you need:</L>
            <TA
              value={ePrompt}
              onChange={(e) => setEPrompt(e.target.value)}
              placeholder="e.g. Polite follow-up to a client who hasn't paid the invoice from 2 weeks ago"
              rows={4}
            />
            <AB
              loading={eBusy}
              icon="📧"
              onClick={() =>
                runTool({
                  type: "email",
                  prompt: ePrompt,
                  setBusyFn: setEBusy,
                  setOut: setEOut,
                  setErr: setEErr,
                  logMsg: "📧 Email drafted",
                })
              }
            >
              Draft Email
            </AB>
            {eErr && <ErrorBox text={eErr} />}
            {eOut && <OB text={eOut} />}
          </TP>
        )}

        {/* SUMMARY */}
        {tab === "summary" && (
          <TP>
            <L>Paste the text to summarize:</L>
            <TA
              value={sInput}
              onChange={(e) => setSInput(e.target.value)}
              placeholder="Paste an article, meeting transcript, document…"
              rows={8}
            />
            <AB
              loading={sBusy}
              icon="📝"
              onClick={() =>
                runTool({
                  type: "summary",
                  prompt: sInput,
                  setBusyFn: setSBusy,
                  setOut: setSOut,
                  setErr: setSErr,
                  logMsg: "📝 Summary generated",
                })
              }
            >
              Summarize
            </AB>
            {sErr && <ErrorBox text={sErr} />}
            {sOut && <OB text={sOut} />}
          </TP>
        )}

        {/* PLANNER */}
        {tab === "planner" && (
          <TP>
            <L>What do you want to plan?</L>
            <TA
              value={pInput}
              onChange={(e) => setPInput(e.target.value)}
              placeholder="e.g. Launch my SaaS landing page in one week"
              rows={3}
            />
            <AB
              loading={pBusy}
              icon="✅"
              onClick={() =>
                runTool({
                  type: "planner",
                  prompt: pInput,
                  setBusyFn: setPBusy,
                  setOut: setPOut,
                  setErr: setPErr,
                  logMsg: "✅ Plan created",
                })
              }
            >
              Create Plan
            </AB>
            {pErr && <ErrorBox text={pErr} />}
            {pOut && <OB text={pOut} />}
          </TP>
        )}

        {/* TRANSLATE */}
        {tab === "translate" && (
          <TP>
            <L>Text to translate:</L>
            <TA
              value={tInput}
              onChange={(e) => setTInput(e.target.value)}
              placeholder="Enter text in any language…"
              rows={5}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <L style={{ margin: 0 }}>Target language:</L>
              <select
                style={css.sel}
                value={tLang}
                onChange={(e) => setTLang(e.target.value)}
              >
                {[
                  "English",
                  "Urdu",
                  "Arabic",
                  "Spanish",
                  "French",
                  "German",
                  "Chinese",
                  "Japanese",
                  "Hindi",
                  "Russian",
                  "Portuguese",
                  "Turkish",
                ].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <AB
              loading={tBusy}
              icon="🌐"
              onClick={() =>
                runTool({
                  type: "translate",
                  prompt: `Translate the following into ${tLang}:\n\n${tInput}`,
                  setBusyFn: setTBusy,
                  setOut: setTOut,
                  setErr: setTErr,
                  logMsg: `🌐 Translated to ${tLang}`,
                })
              }
            >
              Translate
            </AB>
            {tErr && <ErrorBox text={tErr} />}
            {tOut && <OB text={tOut} />}
          </TP>
        )}

        {/* CODE */}
        {tab === "code" && (
          <TP>
            <L>Describe what code you need:</L>
            <TA
              value={cInput}
              onChange={(e) => setCInput(e.target.value)}
              placeholder="e.g. Python script to send emails, JavaScript form validator"
              rows={3}
            />
            <AB
              loading={cBusy}
              icon="💻"
              onClick={() =>
                runTool({
                  type: "code",
                  prompt: cInput,
                  setBusyFn: setCBusy,
                  setOut: setCOut,
                  setErr: setCErr,
                  logMsg: "💻 Code generated",
                })
              }
            >
              Generate Code
            </AB>
            {cErr && <ErrorBox text={cErr} />}
            {cOut && <OB text={cOut} />}
          </TP>
        )}

        {/* LOG */}
        {tab === "log" && (
          <TP>
            {logs.length === 0 ? (
              <div style={css.empty}>
                <div style={{ fontSize: 48 }}>📋</div>
                <p style={{ color: "#64748b", fontSize: 14 }}>No activity yet</p>
              </div>
            ) : (
              logs.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    background: "#1e293b",
                    borderRadius: 9,
                    padding: "9px 12px",
                    border: "1px solid #334155",
                  }}
                >
                  <span
                    style={{ color: "#475569", fontSize: 11, flexShrink: 0 }}
                  >
                    {l.time}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>{l.text}</span>
                </div>
              ))
            )}
          </TP>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <TP>
            <div style={css.sCard}>
              <h3 style={css.sCardH}>🤖 Agent Info</h3>
              <div style={{ marginBottom: 14 }}>
                <label style={css.lbl}>Agent Name</label>
                <input
                  style={css.inp}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button
                style={css.savB}
                onClick={() => {
                  save("aname", name);
                  addLog("⚙️ Settings updated");
                }}
              >
                💾 Save
              </button>
            </div>

            <div style={css.sCard}>
              <h3 style={css.sCardH}>📊 Statistics</h3>
              {[
                ["Status", "🟢 Online"],
                ["AI Model", "⚡ Llama 3.3 70B (Groq)"],
                ["Speed", "Ultra Fast"],
                ["Messages", msgs.length],
                ["Tasks Done", logs.length],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "7px 0",
                    borderTop: "1px solid #0f172a",
                  }}
                >
                  <span style={{ color: "#64748b", fontSize: 13 }}>{k}</span>
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ ...css.sCard, borderColor: "#ef4444" }}>
              <h3 style={css.sCardH}>⚠️ Danger Zone</h3>
              <p
                style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 10px" }}
              >
                Delete all chat history and reset settings.
              </p>
              <button
                style={{
                  background: "#7f1d1d",
                  border: "1px solid #ef4444",
                  borderRadius: 9,
                  padding: "9px 16px",
                  color: "#fca5a5",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (confirm("Reset everything?")) {
                    ["aname", "asetup", "amsgs", "alogs"].forEach((k) =>
                      localStorage.removeItem(k)
                    );
                    window.location.reload();
                  }
                }}
              >
                🗑️ Reset Everything
              </button>
            </div>
          </TP>
        )}
      </main>
    </div>
  );
}

// ── MINI COMPONENTS (unchanged styling) ──
const TP = ({ children }) => (
  <div
    style={{
      flex: 1,
      overflowY: "auto",
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}
  >
    {children}
  </div>
);
const L = ({ children, style }) => (
  <label
    style={{
      display: "block",
      color: "#94a3b8",
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 5,
      ...style,
    }}
  >
    {children}
  </label>
);
const TA = (p) => (
  <textarea
    style={{
      width: "100%",
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: 10,
      padding: "11px 13px",
      color: "#f1f5f9",
      fontSize: 14,
      outline: "none",
      resize: "vertical",
      boxSizing: "border-box",
      fontFamily: "inherit",
    }}
    {...p}
  />
);
const AB = ({ onClick, loading, icon, children }) => (
  <button
    style={{
      background: "linear-gradient(135deg,#3b82f6,#6366f1)",
      border: "none",
      borderRadius: 10,
      padding: "11px 18px",
      color: "#fff",
      fontSize: 14,
      fontWeight: 700,
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.6 : 1,
      alignSelf: "flex-start",
    }}
    onClick={onClick}
    disabled={loading}
  >
    {loading ? "⏳ Working..." : `${icon} ${children}`}
  </button>
);

// Output box — now with markdown rendering and the reusable copy button
const OB = ({ text }) => (
  <div
    style={{
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: 10,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        borderBottom: "1px solid #334155",
      }}
    >
      <span style={{ color: "#64748b", fontSize: 12 }}>Result</span>
      <CopyButton text={text} />
    </div>
    <div
      style={{
        padding: "12px",
        color: "#e2e8f0",
        fontSize: 13,
        lineHeight: 1.7,
        wordBreak: "break-word",
      }}
    >
      <Markdown>{text}</Markdown>
    </div>
  </div>
);

const ErrorBox = ({ text }) => (
  <div
    style={{
      background: "#7f1d1d",
      border: "1px solid #ef4444",
      borderRadius: 10,
      padding: "10px 14px",
      color: "#fca5a5",
      fontSize: 13,
    }}
  >
    ❌ {text}
  </div>
);

const css = {
  bg: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#0f172a,#1e293b)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI',sans-serif",
    padding: 16,
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 20,
    padding: "32px 24px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
  },
  h1: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: 800,
    textAlign: "center",
    margin: "0 0 4px",
  },
  sub: {
    color: "#64748b",
    textAlign: "center",
    marginBottom: 22,
    fontSize: 13,
  },
  lbl: {
    display: "block",
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
  },
  inp: {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 9,
    padding: "10px 12px",
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  launch: {
    width: "100%",
    background: "linear-gradient(135deg,#3b82f6,#6366f1)",
    border: "none",
    borderRadius: 12,
    padding: 13,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  features: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 16,
    justifyContent: "center",
  },
  feat: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 20,
    padding: "5px 11px",
    color: "#64748b",
    fontSize: 11,
  },
  root: {
    display: "flex",
    height: "100vh",
    background: "#0a0f1e",
    fontFamily: "'Segoe UI',sans-serif",
    overflow: "hidden",
    position: "relative",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 199,
  },
  side: {
    width: 210,
    background: "#1e293b",
    borderRight: "1px solid #0f172a",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    flexShrink: 0,
  },
  sHead: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "16px 12px",
    borderBottom: "1px solid #0f172a",
  },
  sName: {
    color: "#f1f5f9",
    fontWeight: 700,
    fontSize: 13,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  nBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    background: "none",
    border: "none",
    borderRadius: 9,
    padding: "9px 10px",
    color: "#64748b",
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 1,
    transition: "all 0.15s",
  },
  nAct: { background: "#0f172a", color: "#f1f5f9", fontWeight: 600 },
  bdg: {
    background: "#3b82f6",
    color: "#fff",
    borderRadius: 20,
    padding: "1px 6px",
    fontSize: 10,
    fontWeight: 700,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
  top: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "11px 14px",
    borderBottom: "1px solid #1e293b",
    background: "#0a0f1e",
    flexShrink: 0,
  },
  topT: { color: "#f1f5f9", fontWeight: 700, fontSize: 15, flex: 1 },
  smB: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 7,
    padding: "4px 9px",
    color: "#94a3b8",
    fontSize: 12,
    cursor: "pointer",
  },
  msgArea: {
    flex: 1,
    overflowY: "auto",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: "30px 16px",
    textAlign: "center",
  },
  bub: { maxWidth: "78%", borderRadius: 14, padding: "9px 13px" },
  uBub: {
    background: "linear-gradient(135deg,#3b82f6,#6366f1)",
    color: "#fff",
    borderBottomRightRadius: 3,
  },
  aBub: {
    background: "#1e293b",
    color: "#e2e8f0",
    borderBottomLeftRadius: 3,
    border: "1px solid #334155",
  },
  cBar: {
    display: "flex",
    gap: 7,
    padding: "11px 13px",
    borderTop: "1px solid #1e293b",
    background: "#0a0f1e",
  },
  cTA: {
    flex: 1,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 11,
    padding: "10px 13px",
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.5,
    maxHeight: 110,
    overflowY: "auto",
  },
  sel: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "7px 11px",
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
  },
  sCard: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: "14px 16px",
  },
  sCardH: {
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: 700,
    margin: "0 0 12px",
  },
  savB: {
    background: "linear-gradient(135deg,#3b82f6,#6366f1)",
    border: "none",
    borderRadius: 9,
    padding: "10px 18px",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
};
