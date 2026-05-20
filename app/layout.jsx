// app/layout.jsx
export const metadata = {
  title: "AI Agent",
  description: "Multi-tool AI assistant powered by Groq",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0a0f1e" }}>
        {children}
      </body>
    </html>
  );
}
