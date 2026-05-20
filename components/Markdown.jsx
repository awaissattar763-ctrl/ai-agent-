// components/Markdown.jsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * Reusable markdown renderer.
 * Styles match the existing dark UI (slate-900 / slate-800 palette).
 */
export default function Markdown({ children }) {
  return (
    <div className="ai-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    borderRadius: 8,
                    fontSize: 13,
                    margin: "8px 0",
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }
            return (
              <code
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontSize: "0.9em",
                  fontFamily: "ui-monospace, Menlo, Consolas, monospace",
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          a: (props) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#60a5fa", textDecoration: "underline" }}
            />
          ),
        }}
      >
        {children || ""}
      </ReactMarkdown>

      <style jsx>{`
        .ai-md :global(p) {
          margin: 0 0 8px;
          line-height: 1.6;
        }
        .ai-md :global(ul),
        .ai-md :global(ol) {
          margin: 4px 0 8px;
          padding-left: 22px;
        }
        .ai-md :global(li) {
          margin: 3px 0;
        }
        .ai-md :global(h1),
        .ai-md :global(h2),
        .ai-md :global(h3) {
          color: #f1f5f9;
          margin: 12px 0 6px;
        }
        .ai-md :global(strong) {
          color: #f1f5f9;
        }
        .ai-md :global(blockquote) {
          border-left: 3px solid #334155;
          margin: 6px 0;
          padding: 2px 12px;
          color: #94a3b8;
        }
        .ai-md :global(table) {
          border-collapse: collapse;
          margin: 8px 0;
        }
        .ai-md :global(th),
        .ai-md :global(td) {
          border: 1px solid #334155;
          padding: 4px 8px;
        }
      `}</style>
    </div>
  );
}
