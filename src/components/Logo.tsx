import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  const { data } = useSiteSettings();
  const url = data?.logo_url;
  if (url) {
    return (
      <img
        src={url}
        alt="Maktab logotipi"
        style={{ width: size, height: size }}
        className={cn("rounded-xl object-cover bg-secondary", className)}
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className={cn("grid place-items-center rounded-xl bg-gradient-primary text-primary-foreground font-semibold", className)}
    >
      51
    </span>
  );
}