"use client";

// Citizen report form with synchronized map data and client-side image preparation.
import { useFormStatus } from "react-dom";
import { useRef, useState } from "react";
import { CategoryIcon, categoryConfig } from "@/lib/categories";
import { categories } from "@/lib/validations";
import { MapPicker } from "@/app/map";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="min-h-12 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{pending ? "Submitting..." : "Submit request"}</button>;
}

/** Collects and submits a validated citizen report with optional media. */
export function RequestForm({ action }: { action: (formData: FormData) => void }) {
  const [category, setCategory] = useState<(typeof categories)[number]>("streetlight");
  const [location, setLocation] = useState("");
  const [pin, setPin] = useState<[number, number] | null>(null);
  const compressing = useRef(false);
  const compressed = useRef(false);
  const selectedFile = useRef<File | null>(null);
  // Resize before upload so the server receives predictable, storage-friendly files.
  const compressImage = async (file: File) => {
    const bitmap = await decodeImage(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close?.();
      throw new Error("Could not create an image canvas");
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    bitmap.close?.();
    if (!blob || blob.size > 5 * 1024 * 1024) throw new Error("Image remains over 5 MB after compression");
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg", lastModified: Date.now() });
  };
  return <form action={action} className="space-y-5" onSubmit={(event) => {
    if (compressing.current) return;
    const input = event.currentTarget.elements.namedItem("image") as HTMLInputElement | null;
    const image = input?.files?.[0];
    if (image && !["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      event.preventDefault();
      input?.setCustomValidity("Choose a JPG, PNG or WebP image under 5 MB.");
      input?.reportValidity();
    } else {
      input?.setCustomValidity("");
      if (image && !compressed.current && selectedFile.current !== image) {
        event.preventDefault();
        compressing.current = true;
        selectedFile.current = image;
        void compressImage(image).then((compressedFile) => {
          const transfer = new DataTransfer();
          transfer.items.add(compressedFile);
          input.files = transfer.files;
          compressed.current = true;
          compressing.current = false;
          event.currentTarget.requestSubmit();
        }).catch(() => {
          compressing.current = false;
          input?.setCustomValidity("We could not process that image. Please choose another file.");
          input?.reportValidity();
        });
      }
    }
  }}>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm font-semibold text-card-foreground"><span className="inline-flex items-center gap-2"><CategoryIcon category={category} />{categoryConfig[category].label}</span><select name="category" value={category} onChange={(event) => setCategory(event.target.value as (typeof categories)[number])} className="mt-2 min-h-12 w-full rounded-lg border bg-background px-3 text-foreground">{categories.map((value) => <option key={value} value={value}>{categoryConfig[value].label}</option>)}</select></label>
      <label className="block text-sm font-semibold text-card-foreground">Location<input name="location" value={location} onChange={(event) => setLocation(event.target.value)} required minLength={3} maxLength={240} placeholder="Street, estate or landmark" className="mt-2 min-h-12 w-full rounded-lg border bg-background px-3 text-foreground placeholder:text-muted-foreground" /></label>
    </div>
    <label className="block text-sm font-semibold text-card-foreground">Description<textarea name="description" required minLength={10} maxLength={2000} rows={5} placeholder="Tell us what needs attention..." className="mt-2 w-full rounded-lg border bg-background px-3 py-3 text-foreground placeholder:text-muted-foreground" /></label>
    <MapPicker locationText={location} onLocationTextChange={setLocation} value={pin} onChange={setPin} />
    <label className="block text-sm font-semibold text-card-foreground">Photo <span className="font-normal text-muted-foreground">(optional, JPG/PNG/WebP up to 5MB)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block min-h-12 w-full rounded-lg border bg-background px-3 py-3 text-sm text-foreground" /></label>
    <SubmitButton />
  </form>;
}

type DecodedImage = CanvasImageSource & { width: number; height: number; close?: () => void };

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Some browsers/codecs reject createImageBitmap; the HTML decoder is the fallback.
    }
  }
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode image"));
      element.src = source;
    });
    return image;
  } finally {
    URL.revokeObjectURL(source);
  }
}
