// components/CopyButton.jsx
"use client";

import { useState } from "react";

export default function CopyButton({ text, style }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers / non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "#0f172a",
        border: "1px solid #334155",
        borderRadius: 6,
        padding: "3px 9px",
        color: copied ? "#4ade80" : "#94a3b8",
        fontSize: 12,
        cursor: "pointer",
        transition: "color 0.15s",
        ...style,
      }}
    >
      {copied ? "✓ Copied" : "📋 Copy"}
    </button>
  );
}
