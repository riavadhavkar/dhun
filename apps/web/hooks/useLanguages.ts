import { useQuery } from "@tanstack/react-query";

import { getLanguages } from "@/lib/api";

export function useLanguages() {
  return useQuery({
    queryKey: ["languages"],
    queryFn: getLanguages,
    staleTime: Infinity,
  });
}
