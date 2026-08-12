import { useQuery } from "@tanstack/react-query";

import { getTranslation } from "@/lib/api";

export function useTranslation(trackId: string | null, lang: string) {
  return useQuery({
    queryKey: ["translation", trackId, lang],
    queryFn: () => getTranslation(trackId as string, lang),
    enabled: trackId !== null,
    staleTime: Infinity, // cached server-side too; a track+lang translation never changes
    retry: false,
  });
}
