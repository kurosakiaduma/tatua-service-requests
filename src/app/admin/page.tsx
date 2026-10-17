import { updateRequestStatus } from "@/app/actions";
import { Nav } from "@/app/nav";
import { StatusBadge } from "@/app/status-badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const instant = false;

const labels: Record<string, string> = { streetlight: "Streetlight", water: "Water", garbage: "Garbage", roads: "Roads", sewage: "Sewage", other: "Other" };

export default async function Admin({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-10">Sign in to continue.</main>;
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (profile?.role !== "admin") return <main className="mx-auto max-w-2xl px-6 py-20"><h1 className="text-2xl font-semibold">Admin access required</h1><p className="mt-2 text-slate-600">This area is restricted to authorized Tatua administrators.</p></main>;
  const { data: requests } = await supabase.from("requests").select("*").order("created_at", { ascending: false });
  const all = requests ?? [];
  const open = all.filter((request) => request.status !== "resolved").length;
  const resolved = all.length - open;
  const params = await searchParams;
  return <><Nav name={profile.full_name} admin /><main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Operations</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Service request dashboard</h1><p className="mt-2 text-slate-600">Review incoming reports and keep residents informed.</p></div>{params.error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{params.error}</p>}{params.updated && <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">Request status updated.</p>}<div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-600">Total requests</p><p className="mt-2 text-3xl font-bold">{all.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-600">Open cases</p><p className="mt-2 text-3xl font-bold text-amber-700">{open}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-600">Resolved</p><p className="mt-2 text-3xl font-bold text-emerald-700">{resolved}</p></div></div><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-6"><h2 className="text-xl font-semibold">All requests</h2><p className="mt-1 text-sm text-slate-600">Update status as work progresses.</p></div><div className="divide-y divide-slate-200">{all.length === 0 ? <p className="p-6 text-slate-600">No requests have been submitted.</p> : all.map((request) => <article key={request.id} className="grid gap-4 p-6 lg:grid-cols-[1fr_1.5fr_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">{labels[request.category]}</h3><StatusBadge status={request.status} /></div><p className="mt-1 text-sm text-slate-600">{request.location}</p></div><p className="text-sm leading-6 text-slate-700">{request.description}</p><form action={updateRequestStatus} className="flex items-center gap-2"><input type="hidden" name="requestId" value={request.id} /><select name="status" defaultValue={request.status} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select><button className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Save</button></form></article>)}</div></section></main></>;
}
