"use client";

// Citizen workspace tabs for creating reports and reviewing private request history.
// Tab switches stay on the client via history.pushState so there is no server
// round trip. The active tab is derived from the URL search params on every
// render so Nav links, deep links, browser back/forward and post-submit
// redirects all land on the right tab.
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FilePlus2, Inbox, Upload } from "lucide-react";
import { RequestForm } from "@/app/request-form";
import { StatusBadge } from "@/app/status-badge";
import { createRequest } from "@/app/actions";
import { ImageThumbnail } from "@/app/image-lightbox";
import type { LinkedOriginalContext, ServiceRequest, StatusHistory } from "@/lib/types";
import { CategoryBadge, categoryConfig } from "@/lib/categories";
import { MapPreview } from "@/app/map";

type RequestWithImage = ServiceRequest & { image_url?: string | null };

/** Renders the citizen request form, list, and selected request detail drawer. */
export function CitizenTabs({
  requests,
  history,
  originalContexts,
}: {
  requests: RequestWithImage[];
  history: StatusHistory[];
  originalContexts: Record<string, LinkedOriginalContext | null>;
}) {
  const params = useSearchParams();
  // Derive the active tab from the URL on every render. Nav links and
  // history.pushState update the URL; this component simply reads it.
  const active =
    params.get("tab") === "requests" || params.get("created") === "1" ? "requests" : "new";
  const [selected, setSelected] = useState<RequestWithImage | null>(null);
  useEffect(() => {
    if (params.get("created") === "1")
      toast.success("Request submitted", {
        description: "Your report is now visible in My requests.",
      });
  }, [params]);
  const select = (tab: string) => {
    window.history.pushState(null, "", `/dashboard?tab=${tab}`);
  };
  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Citizen workspace"
        className="flex overflow-x-auto rounded-xl border bg-card p-1 snap-x"
      >
        <button
          role="tab"
          aria-selected={active === "new"}
          onClick={() => select("new")}
          className={`min-h-12 shrink-0 snap-start rounded-lg px-5 text-sm font-bold ${active === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
        >
          <FilePlus2 className="mr-2 inline" size={17} />
          New request
        </button>
        <button
          role="tab"
          aria-selected={active === "requests"}
          onClick={() => select("requests")}
          className={`min-h-12 shrink-0 snap-start rounded-lg px-5 text-sm font-bold ${active === "requests" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
        >
          <Inbox className="mr-2 inline" size={17} />
          My requests{" "}
          <span className="ml-2 rounded-full bg-card/20 px-2 py-0.5 text-xs">
            {requests.length}
          </span>
        </button>
      </div>
      {active === "new" ? (
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-card-foreground">New request</h2>
              <p className="text-sm text-muted-foreground">
                Give the service team enough detail to act.
              </p>
            </div>
          </div>
          <RequestForm action={createRequest} />
        </section>
      ) : (
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold text-card-foreground">My requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">{requests.length} submitted</p>
          {requests.length ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {requests.map((request) => {
                const latest = history.filter((event) => event.request_id === request.id).at(-1);
                const original = request.duplicate_of ? originalContexts[request.id] : null;
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelected(request)}
                    className="rounded-xl border bg-background p-5 text-left hover:bg-accent/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs font-bold text-primary">
                          {request.reference}
                        </p>
                        <CategoryBadge category={request.category} />
                        <p className="mt-1 text-sm text-muted-foreground">{request.location}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          status={
                            request.duplicate_of && original ? original.status : request.status
                          }
                        />
                        {original && (
                          <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
                            Linked to {original.reference}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-foreground">{request.description}</p>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Submitted {new Date(request.created_at).toLocaleString()} · Updated{" "}
                      {new Date(latest?.created_at ?? request.updated_at).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
              <Inbox className="mx-auto text-muted-foreground" />
              <p className="mt-3 font-semibold text-foreground">No requests yet</p>
              <button
                onClick={() => select("new")}
                className="mt-3 font-bold text-primary hover:underline"
              >
                Submit your first request
              </button>
            </div>
          )}
        </section>
      )}
      {selected && (
        <CitizenDetail
          request={selected}
          history={history}
          original={selected.duplicate_of ? originalContexts[selected.id] : null}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function CitizenDetail({
  request,
  history,
  original,
  onClose,
}: {
  request: RequestWithImage;
  history: StatusHistory[];
  original: LinkedOriginalContext | null;
  onClose: () => void;
}) {
  const image = request.image_url
    ? {
        url: request.image_url,
        reference: request.reference,
        category: categoryConfig[request.category].label,
        createdAt: request.created_at,
        alt: `Photo uploaded for ${request.reference}, ${categoryConfig[request.category].label} request at ${request.location}`,
      }
    : null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-foreground/40"
      onClick={onClose}
    >
      <aside
        className="h-full w-full max-w-xl overflow-y-auto border-l bg-card p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs font-bold text-primary">{request.reference}</p>
            <CategoryBadge category={request.category} />
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border px-3">
            Close
          </button>
        </div>
        <div className="mt-4">
          <StatusBadge status={original?.status ?? request.status} />
          <p className="mt-4 text-sm text-muted-foreground">
            Submitted {new Date(request.created_at).toLocaleString()}
          </p>
          <p className="mt-4 text-foreground">{request.location}</p>
          <MapPreview latitude={request.latitude} longitude={request.longitude} />
          <p className="mt-4 leading-7 text-foreground">{request.description}</p>
          {image && <ImageThumbnail item={image} className="mt-5" />}
        </div>
        {original && (
          <section className="mt-8 rounded-xl bg-secondary p-4">
            <h3 className="font-bold">Linked to {original.reference}</h3>
            <p className="mt-2 text-sm">
              The same issue was already reported. Updates to the original will appear here, and
              your report remains visible as your own submission.
            </p>
            <h4 className="mt-5 font-semibold">Original public timeline</h4>
            <div className="mt-3 space-y-3">
              {original.timeline.map((event, index) => (
                <div
                  key={`${event.created_at}-${index}`}
                  className="border-l-2 border-primary pl-3"
                >
                  <StatusBadge status={event.status} />
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()} · Original report
                  </p>
                  {event.note && <p className="text-sm">{event.note}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        <h3 className="mt-8 border-t pt-6 font-bold text-card-foreground">Your timeline</h3>
        <div className="mt-4 space-y-4">
          {history
            .filter((event) => event.request_id === request.id)
            .map((event) => (
              <div key={event.id} className="border-l-2 border-primary pl-4">
                <StatusBadge status={event.status} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString()} · Your report
                </p>
                {event.note && <p className="mt-2 text-sm text-foreground">{event.note}</p>}
              </div>
            ))}
        </div>
      </aside>
    </div>
  );
}
