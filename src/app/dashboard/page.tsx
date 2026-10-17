import Link from "next/link";
import { createRequest } from "@/app/actions";
import { Nav } from "@/app/nav";
import { RequestForm } from "@/app/request-form";
import { StatusBadge } from "@/app/status-badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const instant = false;

const categoryLabels: Record<string, string> = { streetlight: "Streetlight", water: "Water", garbage: "Garbage", roads: "Roads", sewage: "Sewage", other: "Other" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; welcome?: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-10">Please <Link className="text-teal-700" href="/login">sign in</Link>.</main>;
  const [{ data: profile }, { data: requests }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("requests").select("*").eq("citizen_id", user.id).order("created_at", { ascending: false }),
  ]);
  const params = await searchParams;
  return <><Nav name={profile?.full_name ?? "Citizen"} /><main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Citizen portal</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Report a service issue</h1><p className="mt-2 text-slate-600">Your reports help local teams prioritize what needs attention.</p></div>{params.error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{params.error}</p>}{params.created && <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">Request submitted successfully.</p>}<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-6 text-xl font-semibold">New request</h2><RequestForm action={createRequest} /></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-semibold">My requests</h2><p className="mt-1 text-sm text-slate-600">{requests?.length ?? 0} submitted</p></div>{profile?.role === "admin" && <Link className="text-sm font-semibold text-teal-700" href="/admin">Admin dashboard</Link>}</div>{requests && requests.length > 0 ? <div className="space-y-4">{requests.map((request) => <article key={request.id} className="rounded-xl border border-slate-200 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{categoryLabels[request.category]}</h3><p className="mt-1 text-sm text-slate-500">{request.location}</p></div><StatusBadge status={request.status} /></div><p className="mt-4 text-sm leading-6 text-slate-700">{request.description}</p><p className="mt-4 text-xs text-slate-500">{new Date(request.created_at).toLocaleDateString()}</p></article>)}</div> : <p className="rounded-lg bg-slate-50 p-6 text-slate-600">No requests yet. Your first report will appear here.</p>}</section></main></>;
}
