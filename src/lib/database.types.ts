export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; role: "citizen" | "admin"; created_at: string };
        Insert: { id: string; full_name: string; role?: "citizen" | "admin"; created_at?: string };
        Update: { id?: string; full_name?: string; role?: "citizen" | "admin"; created_at?: string };
      };
      requests: {
        Row: {
          id: string; citizen_id: string; category: "streetlight" | "water" | "garbage" | "roads" | "sewage" | "other";
          location: string; description: string; image_path: string | null;
          status: "pending" | "in_progress" | "resolved"; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; citizen_id: string; category: "streetlight" | "water" | "garbage" | "roads" | "sewage" | "other";
          location: string; description: string; image_path?: string | null; status?: "pending" | "in_progress" | "resolved";
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["requests"]["Insert"]>;
      };
      status_history: {
        Row: { id: string; request_id: string; status: "pending" | "in_progress" | "resolved"; changed_by: string; note: string | null; created_at: string };
        Insert: { id?: string; request_id: string; status: "pending" | "in_progress" | "resolved"; changed_by: string; note?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["status_history"]["Insert"]>;
      };
    };
  };
};
