import { useCallback, useEffect, useState } from "react";
import { studentService } from "@/services/student.service";
import type { StudentDetails } from "@/types/student.types";

export function useStudentDetails(id: string | undefined) {
  const [data, setData] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudent = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const student = await studentService.getById(id);
      setData(student);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load student"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  return { data, isLoading, error, refetch: fetchStudent };
}
