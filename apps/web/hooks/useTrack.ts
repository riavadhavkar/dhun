import { useQuery } from "@tanstack/react-query";

import { getTrack } from "@/lib/api";

export function useTrack(trackId: string) {
  return useQuery({
    queryKey: ["track", trackId],
    queryFn: () => getTrack(trackId),
    staleTime: Infinity,
  });
}
