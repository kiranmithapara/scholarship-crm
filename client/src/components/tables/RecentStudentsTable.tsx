import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/utils";
import { ROUTES, buildPath } from "@/constants/routes.constant";
import type { RecentStudent } from "@/types/dashboard.types";

interface RecentStudentsTableProps {
  students: RecentStudent[];
  isLoading?: boolean;
}

/** RecentStudentsTable - dashboard's "Recent Students" widget. Full sortable/filterable table comes in Part 9. */
export function RecentStudentsTable({ students, isLoading }: RecentStudentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Students</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students yet" description="Students added by referral partners will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">College</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-border/60 last:border-0 hover:bg-accent/50">
                    <td className="py-3">
                      <Link
                        to={buildPath(ROUTES.STUDENT_DETAILS, { id: student.id })}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {student.fullName}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{student.collegeName}</td>
                    <td className="py-3 text-muted-foreground">₹{student.plan}</td>
                    <td className="py-3">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="py-3 text-muted-foreground">{formatDate(student.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
