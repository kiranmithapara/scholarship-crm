import { Loader2 } from "lucide-react";

/** Full-screen loader shown while auth state is being bootstrapped or a lazy page chunk loads */
export function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
