import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ServiceRequest = Database["public"]["Tables"]["requests"]["Row"];
export type StatusHistory = Database["public"]["Tables"]["status_history"]["Row"];
export type LinkedOriginalContext = {
  reference: string;
  category: ServiceRequest["category"];
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: ServiceRequest["status"];
  created_at: string;
  timeline: Array<{ status: ServiceRequest["status"]; note: string | null; created_at: string }>;
};
