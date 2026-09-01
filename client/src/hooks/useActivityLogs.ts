import { useCallback, useEffect, useState } from "react";
import { logsService } from "@/services/logs.service";
import { useDebounce } from "./useDebounce";
import type { ActivityLogListResult } from "@/types/logs.types";

export function useActivityLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<ActivityLogListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await logsService.listActivityLogs({ page, pageSize: 15, search: debouncedSearch || undefined });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load activity logs"));
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return { data, isLoading, error, setPage, search, setSearch, refetch: fetchLogs };
}
