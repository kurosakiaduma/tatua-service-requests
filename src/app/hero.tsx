import { CheckCircle2, MapPin, ShieldCheck } from "lucide-react";

export function Hero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="hero-gradient relative overflow-hidden rounded-3xl px-6 py-10 text-primary-foreground sm:px-10 sm:py-12"><div className="relative z-10 max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.18em] opacity-90">{eyebrow}</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 opacity-90 sm:text-lg">{description}</p></div><div className="absolute right-8 top-8 hidden gap-3 opacity-35 sm:flex"><MapPin size={58} /><CheckCircle2 size={46} /><ShieldCheck size={52} /></div></section>;
}
