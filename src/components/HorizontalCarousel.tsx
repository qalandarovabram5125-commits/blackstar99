import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HorizontalCarousel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative -mx-4 sm:-mx-6", className)}>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 snap-x snap-mandatory hide-scrollbar pb-2">
        {children}
      </div>
    </div>
  );
}