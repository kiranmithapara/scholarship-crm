import { useCallback, useEffect, useState } from "react";
import { logsService } from "@/services/logs.service";
import { useDebounce } from "./useDebounce";
import type { LoginLogListResult } from "@/types/logs.types";

export function useLoginLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<LoginLogListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await logsService.listLoginLogs({ page, pageSize: 15, search: debouncedSearch || undefined });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load login logs"));
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
