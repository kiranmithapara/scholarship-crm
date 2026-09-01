import { useCallback, useEffect, useState } from "react";
import { partnerService } from "@/services/partner.service";
import { useDebounce } from "./useDebounce";
import type { PartnerListResult } from "@/types/partner.types";

/** usePartners - paginated + debounced-search + status-filtered partner list, for the Partner List page. */
export function usePartners() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "blocked" | "all">("all");
  const [data, setData] = useState<PartnerListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await partnerService.list({ page, pageSize: 10, search: debouncedSearch || undefined, status });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load partners"));
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Reset to page 1 whenever the filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  return { data, isLoading, error, page, setPage, search, setSearch, status, setStatus, refetch: fetchPartners };
}
