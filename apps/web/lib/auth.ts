import type { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

// Web Playback SDK needs `streaming`; the rest let us transfer/control playback
// on the device it creates in the browser.
const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
].join(" ");

async function refreshAccessToken(token: JWTWithSpotify): Promise<JWTWithSpotify> {
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await res.json();
    if (!res.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      // Spotify only rotates the refresh token sometimes; keep the old one otherwise.
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("failed to refresh spotify access token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

interface JWTWithSpotify {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  error?: string;
  [key: string]: unknown;
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
      authorization: `https://accounts.spotify.com/authorize?scope=${SPOTIFY_SCOPES}`,
    }),
  ],
  // Keep sign-in and OAuth errors inside the app (handled by <SpotifyConnect>)
  // rather than NextAuth's default standalone pages.
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
        } as JWTWithSpotify;
      }

      const spotifyToken = token as JWTWithSpotify;
      if (Date.now() < spotifyToken.accessTokenExpires) {
        return spotifyToken;
      }

      return refreshAccessToken(spotifyToken);
    },
    async session({ session, token }) {
      const spotifyToken = token as JWTWithSpotify;
      session.accessToken = spotifyToken.accessToken;
      session.error = spotifyToken.error;
      return session;
    },
  },
};
