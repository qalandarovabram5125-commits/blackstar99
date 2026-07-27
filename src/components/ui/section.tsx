import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Section({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("container-page py-12 sm:py-16", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            {title && <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>}
            {subtitle && <p className="text-muted-foreground mt-1 text-sm sm:text-base">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}