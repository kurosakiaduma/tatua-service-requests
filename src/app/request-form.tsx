"use client";

import { useFormStatus } from "react-dom";
import { categories } from "@/lib/validations";

const labels: Record<(typeof categories)[number], string> = {
  streetlight: "Streetlight",
  water: "Water supply",
  garbage: "Garbage collection",
  roads: "Roads",
  sewage: "Sewage",
  other: "Other",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{pending ? "Submitting..." : "Submit request"}</button>;
}

export function RequestForm({ action }: { action: (formData: FormData) => void }) {
  return <form action={action} encType="multipart/form-data" className="space-y-5">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm font-medium">Category<select name="category" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3">{categories.map((category) => <option key={category} value={category}>{labels[category]}</option>)}</select></label>
      <label className="block text-sm font-medium">Location<input name="location" required minLength={3} maxLength={240} placeholder="Street, estate or landmark" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" /></label>
    </div>
    <label className="block text-sm font-medium">Description<textarea name="description" required minLength={10} maxLength={2000} rows={5} placeholder="Tell us what needs attention..." className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" /></label>
    <label className="block text-sm font-medium">Photo <span className="font-normal text-slate-500">(optional, JPG/PNG/WebP up to 5MB)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 text-sm" /></label>
    <SubmitButton />
  </form>;
}
