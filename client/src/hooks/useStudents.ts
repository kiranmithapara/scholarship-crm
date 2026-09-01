import { useCallback, useEffect, useState } from "react";
import { studentService } from "@/services/student.service";
import { useDebounce } from "./useDebounce";
import type { StudentListResult } from "@/types/student.types";

/** useStudents - paginated + debounced-search + plan/status filtered student list. Used by both
 * "All Students" (Super Admin) and "My Students" (Referral Admin) - scoping happens server-side
 * based on the logged-in user's role, so this hook stays identical for both pages. */
export function useStudents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<"2500" | "5000" | "all">("all");
  const [status, setStatus] = useState<"pending" | "verified" | "completed" | "correction_requested" | "all">("all");
  const [data, setData] = useState<StudentListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await studentService.list({ page, pageSize: 10, search: debouncedSearch || undefined, plan, status });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load students"));
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, plan, status]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, plan, status]);

  return { data, isLoading, error, page, setPage, search, setSearch, plan, setPlan, status, setStatus, refetch: fetchStudents };
}
