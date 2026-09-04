"use client";

import { signIn } from "next-auth/react";

import styles from "./SpotifyConnect.module.css";

export type SpotifyGate = "loading" | "connect" | "expired" | "error";

interface SpotifyConnectProps {
  variant: SpotifyGate;
  /** Error detail shown for the "error" variant. */
  message?: string | null;
}

const COPY: Record<
  Exclude<SpotifyGate, "loading">,
  { body: string; cta: string }
> = {
  connect: {
    body: "dhun streams songs through spotify premium",
    cta: "log in with spotify",
  },
  expired: {
    body: "your spotify session expired",
    cta: "log in again",
  },
  error: {
    body: "something went wrong reaching spotify",
    cta: "try again",
  },
};

function SpotifyGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 1 1-.277-1.215c3.808-.87 7.076-.496 9.712 1.115a.623.623 0 0 1 .207.857Zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.688-1.652-6.786-2.13-9.965-1.166a.78.78 0 1 1-.452-1.492c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 0 1 .255 1.073Zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 1 1-.542-1.79c3.532-1.072 9.404-.865 13.115 1.338a.936.936 0 0 1-.955 1.608Z" />
    </svg>
  );
}

export function SpotifyConnect({ variant, message }: SpotifyConnectProps) {
  if (variant === "loading") {
    return (
      <div className={styles.loading}>
        <span className={styles.dot} aria-hidden="true" />
        checking spotify auth status
      </div>
    );
  }

  const copy = COPY[variant];
  const body =
    variant === "error" && message ? message.toLowerCase() : copy.body;

  return (
    <div className={styles.card} role="region" aria-label="spotify sign-in">
      <p className={styles.body}>{body}</p>
      <button
        type="button"
        className={styles.button}
        onClick={() => signIn("spotify")}
      >
        <SpotifyGlyph />
        {copy.cta}
      </button>
    </div>
  );
}
