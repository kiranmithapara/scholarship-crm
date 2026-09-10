import { useCallback, useEffect, useState } from "react";
import { studentService } from "@/services/student.service";
import { useDebounce } from "./useDebounce";
import type { StudentListResult } from "@/types/student.types";

/** useStudents - paginated + debounced-search + service-type/status filtered student list.
 * Used by both "All Students" (Super Admin) and "My Students" (Referral Admin) - scoping
 * happens server-side based on the logged-in user's role, so this hook stays identical for both pages. */
export function useStudents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // V2 UPGRADE: "plan" ('2500'/'5000') -> "serviceType" ('prepaid'/'postpaid')
  const [serviceType, setServiceType] = useState<"prepaid" | "postpaid" | "all">("all");
  const [status, setStatus] = useState<"pending" | "verified" | "completed" | "correction_requested" | "all">("all");
  const [referralPartnerId, setReferralPartnerId] = useState<string>("all");
  const [data, setData] = useState<StudentListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const handleSetSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleSetServiceType = (val: "prepaid" | "postpaid" | "all") => {
    setServiceType(val);
    setPage(1);
  };

  const handleSetStatus = (val: "pending" | "verified" | "completed" | "correction_requested" | "all") => {
    setStatus(val);
    setPage(1);
  };

  const handleSetReferralPartnerId = (val: string) => {
    setReferralPartnerId(val);
    setPage(1);
  };

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cleanPartner = referralPartnerId && referralPartnerId !== "all" ? referralPartnerId.trim() : undefined;
      const cleanSearch = debouncedSearch && debouncedSearch.trim() ? debouncedSearch.trim() : undefined;
      const result = await studentService.list({
        page,
        pageSize: 10,
        search: cleanSearch,
        serviceType,
        status,
        referralPartnerId: cleanPartner,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load students"));
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, serviceType, status, referralPartnerId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    data,
    isLoading,
    error,
    page,
    setPage,
    search,
    setSearch: handleSetSearch,
    serviceType,
    setServiceType: handleSetServiceType,
    status,
    setStatus: handleSetStatus,
    referralPartnerId,
    setReferralPartnerId: handleSetReferralPartnerId,
    refetch: fetchStudents,
  };
}
