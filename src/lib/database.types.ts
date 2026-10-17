export type Database = {
  public: {
    Functions: {
      check_request_submission_limit: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      get_linked_original_context: {
        Args: { p_report_id: string };
        Returns: unknown;
      };
      link_request: {
        Args: { p_report_id: string; p_original_id: string; p_note?: string | null };
        Returns: Database["public"]["Tables"]["requests"]["Row"];
      };
      unlink_request: {
        Args: { p_report_id: string };
        Returns: Database["public"]["Tables"]["requests"]["Row"];
      };
      post_request_update: {
        Args: { p_request_id: string; p_status?: "pending" | "in_progress" | "resolved" | "rejected" | null; p_note?: string | null };
        Returns: Database["public"]["Tables"]["status_history"]["Row"];
      };
    };
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
          latitude: number | null; longitude: number | null;
          reference: string; duplicate_of: string | null;
          status: "pending" | "in_progress" | "resolved" | "rejected"; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; citizen_id: string; category: "streetlight" | "water" | "garbage" | "roads" | "sewage" | "other";
          location: string; description: string; image_path?: string | null;
          latitude?: number | null; longitude?: number | null;
          reference?: string; duplicate_of?: string | null;
          status?: "pending" | "in_progress" | "resolved" | "rejected";
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["requests"]["Insert"]>;
      };
      status_history: {
        Row: { id: string; request_id: string; status: "pending" | "in_progress" | "resolved" | "rejected"; changed_by: string; note: string | null; created_at: string };
        Insert: { id?: string; request_id: string; status: "pending" | "in_progress" | "resolved" | "rejected"; changed_by: string; note?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["status_history"]["Insert"]>;
      };
    };
  };
};
