"use client";

// Private request-image thumbnail and keyboard-navigable lightbox.
import { useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ImageLightboxItem = {
  url: string;
  reference: string;
  category: string;
  createdAt: string;
  alt: string;
};

/** Shows a request thumbnail and opens keyboard-navigable full-size images. */
export function ImageThumbnail({
  item,
  items = [item],
  className = "",
}: {
  item: ImageLightboxItem;
  items?: ImageLightboxItem[];
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(
    Math.max(
      0,
      items.findIndex((candidate) => candidate.url === item.url),
    ),
  );
  const current = items[index] ?? item;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Open image for ${item.reference}`}
          className={`group relative block size-24 overflow-hidden rounded-xl border bg-muted ${className}`}
        >
          {!loaded && (
            <span className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />
          )}
          <Image
            src={item.url}
            alt={item.alt}
            width={96}
            height={96}
            unoptimized
            onLoad={() => setLoaded(true)}
            className={`size-full object-cover transition group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
          <span className="absolute inset-0 grid place-items-center bg-foreground/0 text-primary-foreground opacity-0 transition group-hover:bg-foreground/40 group-hover:opacity-100 group-focus-visible:bg-foreground/40 group-focus-visible:opacity-100">
            <Maximize2 size={20} />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="relative flex max-h-[95vh] max-w-6xl flex-col items-center bg-foreground/95 p-4 text-background">
        <DialogClose className="absolute right-4 top-4 bg-foreground/20 rounded-full p-2 text-background hover:bg-foreground/40" />
        <DialogTitle className="sr-only">Image for {item.reference}</DialogTitle>
        <DialogDescription className="sr-only">{item.alt}</DialogDescription>
        <div
          className="relative flex max-w-full items-center justify-center"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") setIndex((value) => (value + 1) % items.length);
            if (event.key === "ArrowLeft")
              setIndex((value) => (value - 1 + items.length) % items.length);
          }}
          tabIndex={0}
        >
          <Image
            src={current.url}
            alt={current.alt}
            width={1600}
            height={1200}
            unoptimized
            className="max-h-[78vh] max-w-full object-contain"
          />
        </div>
        <p className="mt-3 text-center text-sm">
          {current.reference} · {current.category} · Uploaded{" "}
          {new Date(current.createdAt).toLocaleDateString()}
          {items.length > 1 ? ` · ${index + 1} of ${items.length}` : ""}
        </p>
        {items.length > 1 && (
          <div className="mt-2 flex gap-2">
            {items.map((candidate, candidateIndex) => (
              <button
                type="button"
                key={candidate.url}
                onClick={() => setIndex(candidateIndex)}
                className="size-12 overflow-hidden rounded border"
              >
                <Image
                  src={candidate.url}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
