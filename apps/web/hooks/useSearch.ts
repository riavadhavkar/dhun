import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { searchTracks } from "@/lib/api";

const DEBOUNCE_MS = 300;

export function useSearch(query: string) {
  // Debounce so a full word (~5-10 keystrokes) fires one request instead of
  // one per keystroke — the query itself still updates immediately, so the
  // input never feels laggy, only the network call is delayed.
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchTracks(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 60_000,
  });
}
