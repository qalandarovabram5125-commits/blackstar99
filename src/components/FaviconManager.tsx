import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function FaviconManager() {
  const { data } = useSiteSettings();

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
                 document.createElement("link");
    link.rel = "icon";
    link.href = data?.logo_url || "/favicon.ico";
    if (!document.contains(link)) {
      document.head.appendChild(link);
    }
  }, [data?.logo_url]);

  return null;
}
