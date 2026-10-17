"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { FilePlus2, Inbox, Upload } from "lucide-react";
import { RequestForm } from "@/app/request-form";
import { StatusBadge } from "@/app/status-badge";
import { createRequest } from "@/app/actions";
import type { ServiceRequest } from "@/lib/types";

const labels: Record<string, string> = { streetlight: "Streetlight", water: "Water", garbage: "Garbage", roads: "Roads", sewage: "Sewage", other: "Other" };
export function CitizenTabs({ requests }: { requests: ServiceRequest[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("tab") === "requests" || params.get("created") === "1" ? "requests" : "new";
  useEffect(() => { if (params.get("created") === "1") toast.success("Request submitted", { description: "Your report is now visible in My requests." }); }, [params]);
  const select = (tab: string) => router.push(`/dashboard?tab=${tab}`);
  return <div className="space-y-5"><div role="tablist" aria-label="Citizen workspace" className="flex overflow-x-auto rounded-xl border bg-card p-1 snap-x"><button role="tab" aria-selected={active === "new"} onClick={() => select("new")} className={`min-h-12 shrink-0 snap-start rounded-lg px-5 text-sm font-bold ${active === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}><FilePlus2 className="mr-2 inline" size={17} />New request</button><button role="tab" aria-selected={active === "requests"} onClick={() => select("requests")} className={`min-h-12 shrink-0 snap-start rounded-lg px-5 text-sm font-bold ${active === "requests" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}><Inbox className="mr-2 inline" size={17} />My requests <span className="ml-2 rounded-full bg-card/20 px-2 py-0.5 text-xs">{requests.length}</span></button></div>{active === "new" ? <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Upload size={18} /></div><div><h2 className="text-xl font-bold text-card-foreground">New request</h2><p className="text-sm text-muted-foreground">Give the service team enough detail to act.</p></div></div><RequestForm action={createRequest} /></section> : <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7"><h2 className="text-xl font-bold text-card-foreground">My requests</h2><p className="mt-1 text-sm text-muted-foreground">{requests.length} submitted</p>{requests.length ? <div className="mt-6 grid gap-4 lg:grid-cols-2">{requests.map((request) => <article key={request.id} className="rounded-xl border bg-background p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-foreground">{labels[request.category]}</h3><p className="mt-1 text-sm text-muted-foreground">{request.location}</p></div><StatusBadge status={request.status} /></div><p className="mt-4 text-sm leading-6 text-foreground">{request.description}</p><p className="mt-4 text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p></article>)}</div> : <div className="mt-6 rounded-xl border border-dashed p-8 text-center"><Inbox className="mx-auto text-muted-foreground" /><p className="mt-3 font-semibold text-foreground">No requests yet</p><button onClick={() => select("new")} className="mt-3 font-bold text-primary hover:underline">Submit your first request</button></div>}</section>}</div>;
}
