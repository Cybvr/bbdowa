"use client";

// Used only when the root layout itself crashes, so it brings its own html and plain styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", display: "grid", minHeight: "100vh", placeItems: "center", padding: 16 }}>
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ color: "#666", margin: "0 0 20px" }}>The app couldn’t load. Try again, or reload the page.</p>
          <button type="button" onClick={reset} style={{ padding: "10px 18px", borderRadius: 6, border: 0, background: "#111", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
