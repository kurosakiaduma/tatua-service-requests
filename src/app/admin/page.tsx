import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Nav } from "@/app/nav";
import { Hero } from "@/app/hero";
import { AdminTabs } from "@/app/admin-tabs";

export const instant = false;
export default async function Admin({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-10">Please <Link className="text-primary" href="/login">sign in</Link>.</main>;
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (profile?.role !== "admin") return <main className="mx-auto max-w-2xl px-6 py-20"><h1 className="text-2xl font-bold text-foreground">Admin access required</h1><p className="mt-2 text-muted-foreground">This area is restricted to authorized Tatua administrators.</p></main>;
  const [{ data: requests }, { data: history }] = await Promise.all([
    supabase.from("requests").select("*").order("created_at", { ascending: false }),
    supabase.from("status_history").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const params = await searchParams;
  return <><Nav name={profile.full_name} role={profile.role} admin /><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><Hero eyebrow="Operations centre" title="See the work. Move it forward." description="A clear view of incoming reports, team activity and the issues closest to resolution." /><AdminTabs requests={requests ?? []} history={history ?? []} updated={params.updated === "1"} /></main></>;
}
