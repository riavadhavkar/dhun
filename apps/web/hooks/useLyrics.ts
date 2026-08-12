import { useQuery } from "@tanstack/react-query";

import { getLyrics } from "@/lib/api";

export function useLyrics(trackId: string | null, lang: string) {
  return useQuery({
    queryKey: ["lyrics", trackId, lang],
    queryFn: () => getLyrics(trackId as string, lang),
    enabled: trackId !== null,
    staleTime: Infinity, // translations are cached server-side too; a track+lang never changes
    retry: false,
  });
}
