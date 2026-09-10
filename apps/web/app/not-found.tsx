import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-md)",
        padding: "var(--space-xl)",
        textAlign: "center",
        color: "var(--text)",
        background: "var(--bg)",
      }}
    >
      <span style={{ fontSize: "3rem" }}>(ᵕ—ᴗ—)</span>
      <h1 style={{ margin: 0, fontSize: "1.25rem" }}>this page skipped a beat</h1>
      <p style={{ margin: 0, color: "var(--text-dim)", maxWidth: "32ch" }}>
        there&apos;s nothing here. head back and find something to sing along to.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "var(--space-sm)",
          color: "var(--accent-ink)",
          background: "var(--accent-soft)",
          padding: "var(--space-sm) var(--space-lg)",
          borderRadius: "var(--radius-full)",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        back to dhun
      </Link>
    </main>
  );
}
