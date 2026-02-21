import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient with offline-first defaults.
 * - gcTime: 24 hours — keeps data in memory/cache for a full day
 * - staleTime: 5 minutes — data is fresh for 5 min, then silently refetched (SWR)
 * - networkMode: offlineFirst — always serve cache first, even if offline
 * - retry: only retry when online
 * - refetchOnReconnect: always refetch when coming back online
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes — stale-while-revalidate
      networkMode: "offlineFirst",
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        return failureCount < 2;
      },
      refetchOnReconnect: "always",
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: "offlineFirst",
      retry: (failureCount) => {
        if (!navigator.onLine) return false;
        return failureCount < 1;
      },
    },
  },
});

console.log("[QueryClient] ✅ Initialized with networkMode: offlineFirst");
