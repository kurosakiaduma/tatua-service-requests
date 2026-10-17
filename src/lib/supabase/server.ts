// Request-scoped Supabase client that reads and refreshes the user session.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Creates a request-scoped Supabase client whose session is stored in cookies. */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server components may be read-only; middleware refreshes sessions when needed.
        }
      },
    },
  });
}
