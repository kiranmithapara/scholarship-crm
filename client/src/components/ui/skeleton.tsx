import { cn } from "@/lib/utils";

/** Skeleton - shimmer loading placeholder, used everywhere data is being fetched. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-md", className)} {...props} />;
}

export { Skeleton };
