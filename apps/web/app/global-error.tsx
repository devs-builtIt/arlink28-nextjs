"use client";

// The last resort: this replaces the whole page, including the layout, when something above the layout fails. No
// stylesheets are assumed to have loaded, so it styles itself.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#ffffff",
          color: "#212121",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <main style={{ maxWidth: 520 }}>
          <h1 style={{ margin: "0 0 12px", fontSize: 40, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            We could not load this page.
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: 18, lineHeight: 1.5, color: "#555" }}>
            The problem is on our side. Try again, and if it keeps happening, email info@arlink28.com.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "14px 26px",
              border: 0,
              borderRadius: 999,
              background: "#e61e2b",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 24, fontSize: 13, color: "#777" }}>Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
