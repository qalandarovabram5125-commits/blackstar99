import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export type SiteSettings = {
  school_name: string;
  motto: string;
  hero_image_url: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  stat_students: number;
  stat_teachers: number;
  stat_workers: number;
  stat_university_pct: number;
  admin_telegram_chat_id: string | null;
};

export const useSiteSettings = () =>
  useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings> => {
      try {
        return await api.getSiteSettings();
      } catch {
        return {
          school_name: "51-maktab",
          motto: "Bilim — kelajak kaliti",
          hero_image_url: null,
          logo_url: null,
          address: "Toshkent shahri",
          phone: "",
          email: "",
          latitude: 41.2995,
          longitude: 69.2401,
          stat_students: 0,
          stat_teachers: 0,
          stat_workers: 0,
          stat_university_pct: 0,
          admin_telegram_chat_id: null,
        };
      }
    },
    staleTime: 60_000,
  });
