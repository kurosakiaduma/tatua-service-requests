import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Nav } from "@/app/nav";
import { Hero } from "@/app/hero";
import { AdminTabs } from "@/app/admin-tabs";

// Administrator dashboard guarded by both the profile role and database RLS.
export const instant = false;
/** Loads operational data for an authorized administrator. */
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return (
      <main className="p-10">
        Please{" "}
        <Link className="text-primary" href="/login">
          sign in
        </Link>
        .
      </main>
    );
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return (
      <main className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-2xl font-bold text-foreground">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">
          This area is restricted to authorized Tatua administrators.
        </p>
        <p className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </p>
      </main>
    );
  const [{ data: requests }, { data: history }] = await Promise.all([
    supabase.from("requests").select("*").order("created_at", { ascending: false }),
    supabase
      .from("status_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  // The bucket is private; URLs are short-lived and generated per authorized admin view.
  const requestsWithImages = await Promise.all(
    (requests ?? []).map(async (request) => {
      if (!request.image_path) return { ...request, image_url: null };
      const { data } = await supabase.storage
        .from("request-images")
        .createSignedUrl(request.image_path, 3600);
      return { ...request, image_url: data?.signedUrl ?? null };
    }),
  );
  const params = await searchParams;
  return (
    <>
      <Nav name={profile.full_name} role={profile.role} admin />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Hero
          eyebrow="Operations centre"
          title="See the work. Move it forward."
          description="A clear view of incoming reports, team activity and the issues closest to resolution."
        />
        <AdminTabs
          requests={requestsWithImages}
          history={history ?? []}
          updated={params.updated === "1"}
        />
      </main>
    </>
  );
}
