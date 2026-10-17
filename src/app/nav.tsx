import Link from "next/link";
import { signOut } from "@/app/actions";

export function Nav({ name, admin = false }: { name: string; admin?: boolean }) {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><Link href="/" className="text-xl font-bold text-teal-700">Tatua</Link><div className="flex items-center gap-4 text-sm"><span className="hidden text-slate-600 sm:inline">Hello, {name}</span>{admin && <Link className="font-semibold text-teal-700" href="/dashboard">Citizen view</Link>}<form action={signOut}><button className="rounded-lg border border-slate-300 px-3 py-2 font-medium hover:bg-slate-50">Sign out</button></form></div></div></header>;
}
