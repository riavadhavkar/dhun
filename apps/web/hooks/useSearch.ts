import { useQuery } from "@tanstack/react-query";

import { searchTracks } from "@/lib/api";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchTracks(query),
    enabled: query.trim().length > 0,
    staleTime: 60_000,
  });
}
