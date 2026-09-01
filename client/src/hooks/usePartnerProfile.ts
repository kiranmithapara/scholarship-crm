import { useCallback, useEffect, useState } from "react";
import { partnerService } from "@/services/partner.service";
import type { PartnerProfile } from "@/types/partner.types";

export function usePartnerProfile(id: string | undefined) {
  const [data, setData] = useState<PartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const profile = await partnerService.getProfile(id);
      setData(profile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load partner profile"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { data, isLoading, error, refetch: fetchProfile };
}
