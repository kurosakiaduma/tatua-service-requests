import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Nav } from "@/app/nav";
import { Hero } from "@/app/hero";
import { CitizenTabs } from "@/app/citizen-tabs";
import type { LinkedOriginalContext } from "@/lib/types";

export const instant = false;
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; welcome?: string; tab?: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-10">Please <Link className="text-primary" href="/login">sign in</Link>.</main>;
  const [{ data: profile }, { data: requests }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("requests").select("*").eq("citizen_id", user.id).order("created_at", { ascending: false }),
    supabase.from("status_history").select("*").order("created_at", { ascending: true }),
  ]);
  // Signed URLs keep request images private while allowing the dashboard to display them.
  const requestsWithImages = await Promise.all((requests ?? []).map(async (request) => {
    if (!request.image_path) return { ...request, image_url: null };
    const { data } = await supabase.storage.from("request-images").createSignedUrl(request.image_path, 3600);
    return { ...request, image_url: data?.signedUrl ?? null };
  }));
  // This RPC returns only the original report fields safe for a linked citizen to see.
  const originalContexts = Object.fromEntries(await Promise.all((requests ?? []).filter((request) => request.duplicate_of).map(async (request) => {
    const { data } = await supabase.rpc("get_linked_original_context", { p_report_id: request.id });
    return [request.id, (data as LinkedOriginalContext | null) ?? null] as const;
  })));
  const params = await searchParams;
  return <><Nav name={profile?.full_name ?? "Citizen"} role={profile?.role} admin={profile?.role === "admin"} /><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><Hero eyebrow="Citizen portal" title="Your voice, your neighbourhood." description="Report a service issue and follow every step toward resolution." />{params.error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{params.error}</p>}{params.created && <p role="status" className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm font-semibold text-success">Request submitted successfully. Find it in My requests.</p>}<CitizenTabs requests={requestsWithImages} history={history ?? []} originalContexts={originalContexts} /></main></>;
}
