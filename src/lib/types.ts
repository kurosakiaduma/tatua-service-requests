// Application aliases for generated Supabase rows and the safe linked-report view.
import type { Database } from "@/lib/database.types";

/** Generated profile row including the user's role. */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
/** Generated request row used by citizen and administrator views. */
export type ServiceRequest = Database["public"]["Tables"]["requests"]["Row"];
/** Generated append-only request timeline row. */
export type StatusHistory = Database["public"]["Tables"]["status_history"]["Row"];
/** Public subset of an original report returned to a linked citizen. */
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
