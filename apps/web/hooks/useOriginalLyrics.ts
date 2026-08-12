import { useQuery } from "@tanstack/react-query";

import { getOriginalLyrics } from "@/lib/api";

export function useOriginalLyrics(trackId: string | null) {
  return useQuery({
    queryKey: ["original-lyrics", trackId],
    queryFn: () => getOriginalLyrics(trackId as string),
    enabled: trackId !== null,
    staleTime: Infinity, // cached server-side too; a track's original lyrics never change
    retry: false,
  });
}
