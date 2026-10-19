"use client";

// Administrator workspace for request triage, updates, linking, and activity review.
import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Link2, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { linkRequest, unlinkRequest, updateRequestStatus } from "@/app/actions";
import { ImageThumbnail } from "@/app/image-lightbox";
import { MapPreview } from "@/app/map";
import { StatusBadge } from "@/app/status-badge";
import { AdminCharts } from "@/app/charts";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ServiceRequest, StatusHistory } from "@/lib/types";
import { CategoryBadge } from "@/lib/categories";
import { externalImageUrl } from "@/lib/request-image";

type RequestWithImage = ServiceRequest & { image_url?: string | null };
type Props = { requests: RequestWithImage[]; history: StatusHistory[]; updated?: boolean };

/** Renders filtered request views, analytics, and request management actions. */
export function AdminTabs({ requests, history, updated = false }: Props) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [showLinked, setShowLinked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = requests.find((request) => request.id === selectedId) ?? null;
  useEffect(() => {
    if (updated)
      toast.success("Request updated", { description: "The timeline and reports are refreshed." });
  }, [updated]);
  const primary = useMemo(() => requests.filter((request) => !request.duplicate_of), [requests]);
  const filtered = useMemo(
    () =>
      requests.filter(
        (request) =>
          (showLinked || !request.duplicate_of) &&
          (status === "all" || request.status === status) &&
          (category === "all" || request.category === category) &&
          `${request.reference} ${request.location} ${request.description}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [requests, showLinked, status, category, search],
  );
  const originals = requests.filter((request) => !request.duplicate_of);
  const linkedCount = (requestId: string) =>
    requests.filter((candidate) => candidate.duplicate_of === requestId).length;
  const update = async (formData: FormData) => {
    await updateRequestStatus(formData);
  };
  return (
    <div className="space-y-5">
      <div role="tablist" className="flex overflow-x-auto rounded-xl border bg-card p-1 snap-x">
        <Tab
          active={tab === "overview"}
          onClick={() => setTab("overview")}
          icon={<BarChart3 size={17} />}
        >
          Overview
        </Tab>
        <Tab
          active={tab === "requests"}
          onClick={() => setTab("requests")}
          icon={<SlidersHorizontal size={17} />}
        >
          Requests{" "}
          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">
            {filtered.length}
          </span>
        </Tab>
        <Tab
          active={tab === "activity"}
          onClick={() => setTab("activity")}
          icon={<Activity size={17} />}
        >
          Activity
        </Tab>
      </div>
      {tab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Primary requests" value={primary.length} />
            <Stat label="Total reports received" value={requests.length} />
            <Stat
              label="Open cases"
              value={
                primary.filter(
                  (request) => request.status === "pending" || request.status === "in_progress",
                ).length
              }
              tone="warning"
            />
            <Stat
              label="Resolved"
              value={primary.filter((request) => request.status === "resolved").length}
              tone="success"
            />
          </div>
          <AdminCharts requests={requests} />
        </>
      )}
      {tab === "requests" && (
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="sticky top-16 z-10 border-b bg-card/95 p-4 backdrop-blur">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <label className="relative">
                <Search className="absolute left-3 top-3.5 text-muted-foreground" size={17} />
                <input
                  aria-label="Search requests"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reference, location or description"
                  className="min-h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-foreground"
                />
              </label>
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="min-h-11 rounded-lg border bg-background px-3 text-foreground"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                aria-label="Filter by category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-11 rounded-lg border bg-background px-3 text-foreground"
              >
                <option value="all">All categories</option>
                {Object.entries({
                  streetlight: "Streetlight",
                  water: "Water",
                  garbage: "Garbage",
                  roads: "Roads",
                  sewage: "Sewage",
                  other: "Other",
                }).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={showLinked}
                onChange={(event) => setShowLinked(event.target.checked)}
              />
              Show linked reports
            </label>
          </div>
          <div className="divide-y">
            {filtered.length ? (
              filtered.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelectedId(request.id)}
                  className="cursor-pointer grid w-full gap-3 p-5 text-left hover:bg-accent/50 md:grid-cols-[1fr_1.5fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-primary">{request.reference}</p>
                    <CategoryBadge category={request.category} />
                    <p className="mt-1 text-sm text-muted-foreground">{request.location}</p>
                  </div>
                  <p className="line-clamp-2 text-sm text-foreground">{request.description}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={request.status} />
                    {request.duplicate_of ? (
                      <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
                        Linked
                      </span>
                    ) : (
                      linkedCount(request.id) > 0 && (
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
                          {linkedCount(request.id)} reports
                        </span>
                      )
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-10 text-center">
                <p className="font-bold text-foreground">No matching requests</p>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </section>
      )}
      {tab === "activity" && (
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold text-card-foreground">
            <Activity size={20} /> Recent activity
          </h2>
          <div className="mt-5 space-y-4">
            {history.length ? (
              history.slice(0, 20).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-4 border-b pb-4"
                >
                  <div>
                    <StatusBadge status={event.status} />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.note ?? "Request status updated"}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </time>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No activity yet.</p>
            )}
          </div>
        </section>
      )}
      {selected && (
        <Detail
          request={selected}
          requests={requests}
          history={history}
          originals={originals}
          onClose={() => setSelectedId(null)}
          update={update}
        />
      )}
    </div>
  );
}

function Detail({
  request,
  requests,
  history,
  originals,
  onClose,
  update,
}: {
  request: RequestWithImage;
  requests: RequestWithImage[];
  history: StatusHistory[];
  originals: RequestWithImage[];
  onClose: () => void;
  update: (data: FormData) => Promise<void>;
}) {
  const linkedReports = requests.filter((candidate) => candidate.duplicate_of === request.id);
  const original = request.duplicate_of
    ? requests.find((candidate) => candidate.id === request.duplicate_of)
    : null;
  const imageUrl = request.image_url ?? externalImageUrl(request.image_path);
  const image = imageUrl
    ? {
        url: imageUrl,
        reference: request.reference,
        category: request.category,
        createdAt: request.created_at,
        alt: `Photo uploaded for ${request.reference}, ${request.category} request at ${request.location}`,
      }
    : null;
  const linkedImages = linkedReports.flatMap((candidate) => {
    const url = candidate.image_url ?? externalImageUrl(candidate.image_path);
    return url
      ? [
          {
            url,
            reference: candidate.reference,
            category: candidate.category,
            createdAt: candidate.created_at,
            alt: `Photo uploaded for linked report ${candidate.reference}`,
          },
        ]
      : [];
  });
  return (
    <Dialog open>
      <DialogContent
        showClose={false}
        className="flex flex-col max-h-[90vh] max-w-[90vw] w-full sm:max-w-lg bg-card p-6 shadow-2xl [&>*]:shrink-0"
      >
        <DialogDescription className="sr-only">
          Request details for {request.reference}
        </DialogDescription>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold text-primary">{request.reference}</p>
            <CategoryBadge category={request.category} />
            <h2 className="mt-1 text-2xl font-bold text-card-foreground">{request.location}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer min-h-11 rounded-lg border px-3 text-sm font-bold"
          >
            Close
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <StatusBadge status={request.status} />
          {request.duplicate_of && (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
              Linked to {original?.reference ?? "original"}
            </span>
          )}
        </div>
        {request.duplicate_of ? (
          <p className="mt-4 rounded-xl bg-secondary p-4 text-sm">
            This report is linked to {original?.reference ?? "the original"} and follows its status.
            Its controls are managed on the original report.
          </p>
        ) : (
          <>
            <MapPreview latitude={request.latitude} longitude={request.longitude} />
            {image && <ImageThumbnail item={image} className="mt-5" />}
            <p className="mt-6 leading-7 text-foreground">{request.description}</p>
            <form
              action={update}
              className="mt-8 space-y-3"
              onSubmit={() => setTimeout(onClose, 100)}
            >
              <input type="hidden" name="requestId" value={request.id} />
              <select
                name="status"
                defaultValue={request.status}
                className="min-h-11 w-full rounded-lg border bg-background px-3 text-foreground"
              >
                <option value="">Keep current status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              <textarea
                name="note"
                required={request.status === "rejected"}
                minLength={request.status === "rejected" ? 10 : undefined}
                rows={4}
                placeholder="Message for citizens (optional for status-only updates)"
                className="w-full rounded-lg border bg-background px-3 py-3 text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Messages on this request are visible to everyone linked to it.
              </p>
              <SubmitButton
                label="Post update"
                variant="primary"
                className="min-h-11 px-4 font-bold"
              />
            </form>
          </>
        )}
        {!request.duplicate_of && (
          <section className="mt-8 border-t pt-6">
            <h3 className="font-bold text-card-foreground">
              Linked reports{" "}
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                {linkedReports.length}
              </span>
            </h3>
            {linkedReports.length ? (
              <div className="mt-4 space-y-3">
                {linkedReports.map((linked) => {
                  const linkedImage = linkedImages.find(
                    (candidate) => candidate.reference === linked.reference,
                  );
                  return (
                    <div key={linked.id} className="rounded-xl border p-3">
                      <p className="font-mono text-xs font-bold text-primary">{linked.reference}</p>
                      <p className="mt-1 text-sm">{linked.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted {new Date(linked.created_at).toLocaleDateString()}
                        {distanceBetween(request, linked) === null
                          ? ""
                          : ` · ${distanceBetween(request, linked)} from original pin`}
                      </p>
                      {linkedImage && (
                        <ImageThumbnail item={linkedImage} items={linkedImages} className="mt-2" />
                      )}
                      <form action={unlinkRequest} className="mt-2">
                        <input type="hidden" name="reportId" value={linked.id} />
                        <SubmitButton
                          label="Unlink"
                          pendingLabel="Unlinking…"
                          variant="destructive-outline"
                          className="inline-flex items-center gap-1 text-sm"
                        />
                      </form>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No linked reports yet.</p>
            )}
            <div className="mt-5 rounded-xl border p-4">
              <p className="flex items-center gap-2 font-semibold">
                <Link2 size={16} />
                Possible duplicates
              </p>
              <form action={linkRequest} className="mt-3 space-y-2">
                <input type="hidden" name="reportId" value={request.id} />
                <select
                  name="originalId"
                  required
                  className="min-h-11 w-full rounded-lg border bg-background px-3 text-foreground"
                >
                  <option value="">Choose original report</option>
                  {originals
                    .filter((candidate) => candidate.id !== request.id)
                    .map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.reference} · {candidate.location}
                      </option>
                    ))}
                </select>
                <input
                  name="note"
                  placeholder="Optional message"
                  className="min-h-11 w-full rounded-lg border bg-background px-3 py-3 text-foreground"
                />
                <SubmitButton
                  label="Link as duplicate"
                  pendingLabel="Linking…"
                  variant="primary"
                  className="min-h-11 px-4 font-bold"
                />
              </form>
            </div>
          </section>
        )}
        {request.duplicate_of && original && (
          <section className="mt-8 border-t pt-6">
            <h3 className="font-bold">Original public timeline · {original.reference}</h3>
            <div className="mt-4 space-y-3">
              {history
                .filter((event) => event.request_id === original.id)
                .map((event) => (
                  <div key={event.id}>
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
        <section className="mt-8 border-t pt-6">
          <h3 className="font-bold">Status timeline</h3>
          <div className="mt-4 space-y-3">
            {history
              .filter((event) => event.request_id === request.id)
              .map((event) => (
                <div key={event.id}>
                  <StatusBadge status={event.status} />
                  <span className="ml-3 text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                  {event.note && <p className="mt-1 text-sm">{event.note}</p>}
                </div>
              ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}

function distanceBetween(a: RequestWithImage, b: RequestWithImage) {
  if (a.latitude === null || a.longitude === null || b.latitude === null || b.longitude === null)
    return null;
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  const metres = 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

function Tab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`cursor-pointer flex min-h-12 shrink-0 snap-start items-center rounded-lg px-5 text-sm font-bold ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
    >
      {icon}
      <span className="ml-2">{children}</span>
    </button>
  );
}
function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-5 shadow-sm ${tone === "warning" ? "border-warning/40" : tone === "success" ? "border-success/40" : ""}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
    </div>
  );
}
