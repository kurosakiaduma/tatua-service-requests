"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { CategoryIcon, categoryConfig } from "@/lib/categories";
import { categories } from "@/lib/validations";
import { MapPicker } from "@/app/map";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="min-h-12 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{pending ? "Submitting..." : "Submit request"}</button>;
}

export function RequestForm({ action }: { action: (formData: FormData) => void }) {
  const [category, setCategory] = useState<(typeof categories)[number]>("streetlight");
  return <form action={action} encType="multipart/form-data" className="space-y-5" onSubmit={(event) => {
    const input = event.currentTarget.elements.namedItem("image") as HTMLInputElement | null;
    const image = input?.files?.[0];
    if (image && (image.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(image.type))) {
      event.preventDefault();
      input?.setCustomValidity("Choose a JPG, PNG or WebP image under 5 MB.");
      input?.reportValidity();
    } else {
      input?.setCustomValidity("");
    }
  }}>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm font-semibold text-card-foreground"><span className="inline-flex items-center gap-2"><CategoryIcon category={category} />{categoryConfig[category].label}</span><select name="category" value={category} onChange={(event) => setCategory(event.target.value as (typeof categories)[number])} className="mt-2 min-h-12 w-full rounded-lg border bg-background px-3 text-foreground">{categories.map((value) => <option key={value} value={value}>{categoryConfig[value].label}</option>)}</select></label>
      <label className="block text-sm font-semibold text-card-foreground">Location<input name="location" required minLength={3} maxLength={240} placeholder="Street, estate or landmark" className="mt-2 min-h-12 w-full rounded-lg border bg-background px-3 text-foreground placeholder:text-muted-foreground" /></label>
    </div>
    <label className="block text-sm font-semibold text-card-foreground">Description<textarea name="description" required minLength={10} maxLength={2000} rows={5} placeholder="Tell us what needs attention..." className="mt-2 w-full rounded-lg border bg-background px-3 py-3 text-foreground placeholder:text-muted-foreground" /></label>
    <MapPicker />
    <label className="block text-sm font-semibold text-card-foreground">Photo <span className="font-normal text-muted-foreground">(optional, JPG/PNG/WebP up to 5MB)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block min-h-12 w-full rounded-lg border bg-background px-3 py-3 text-sm text-foreground" /></label>
    <SubmitButton />
  </form>;
}
