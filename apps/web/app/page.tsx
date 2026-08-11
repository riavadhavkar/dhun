"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useSearch } from "@/hooks/useSearch";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const { data: results, isFetching, error } = useSearch(query);

  return (
    <main>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "1.5rem" }}>dhun</h1>
      <input
        type="text"
        placeholder="Search for a song..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
        }}
      />

      {isFetching && <p style={{ color: "var(--text-dim)", marginTop: "1rem" }}>Searching…</p>}
      {error && (
        <p style={{ color: "#f87171", marginTop: "1rem" }}>
          Couldn&apos;t reach the search service. Is the backend running?
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
        {results?.map((track) => (
          <li key={track.id}>
            <Link
              href={`/song/${track.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.6rem 0.5rem",
                borderRadius: "8px",
              }}
            >
              {track.album_art ? (
                <Image
                  src={track.album_art}
                  alt={track.album}
                  width={48}
                  height={48}
                  style={{ borderRadius: "4px" }}
                />
              ) : (
                <div style={{ width: 48, height: 48, background: "var(--surface)", borderRadius: 4 }} />
              )}
              <div>
                <div>{track.name}</div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>{track.artist}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
