import { useEffect, useState, useCallback } from "react";
import { api } from "@/api/client";
import { useAuth } from "./useAuth";

export type RoomSummary = {
  room_id: string;
  unread: number;
  last_content: string | null;
  last_at: string | null;
  last_sender_id: string | null;
};

export function useUnread() {
  const { user } = useAuth();
  const [map, setMap] = useState<Record<string, RoomSummary>>({});

  const load = useCallback(async () => {
    if (!user) { setMap({}); return; }
    try {
      const rooms = await api.getChatRooms();
      const m: Record<string, RoomSummary> = {};
      rooms.forEach((r: any) => {
        m[r.id] = { room_id: r.id, unread: 0, last_content: null, last_at: r.updated_at, last_sender_id: null };
      });
      setMap(m);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [user, load]);

  const total = Object.values(map).reduce((a, r) => a + (r.unread || 0), 0);
  const markRead = useCallback(async (roomId: string) => {
    setMap((prev) => ({ ...prev, [roomId]: { ...(prev[roomId] ?? { room_id: roomId, unread: 0, last_content: null, last_at: null, last_sender_id: null }), unread: 0 } }));
  }, []);
  return { map, total, refresh: load, markRead };
}
