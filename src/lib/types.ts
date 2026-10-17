import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ServiceRequest = Database["public"]["Tables"]["requests"]["Row"];
export type StatusHistory = Database["public"]["Tables"]["status_history"]["Row"];
