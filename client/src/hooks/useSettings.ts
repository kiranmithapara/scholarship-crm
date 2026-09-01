import { useCallback, useEffect, useState } from "react";
import { settingsService } from "@/services/settings.service";
import type { Settings } from "@/types/settings.types";

export function useSettings() {
  const [data, setData] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const settings = await settingsService.get();
      setData(settings);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load settings"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { data, isLoading, error, refetch: fetchSettings };
}
