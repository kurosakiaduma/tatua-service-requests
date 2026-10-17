import Link from "next/link";
import { signIn } from "@/app/actions";
import { Submit } from "@/app/auth-form";

export const instant = false;

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12"><section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Tatua</p><h1 className="mt-3 text-3xl font-semibold text-slate-950">Welcome back</h1><p className="mt-2 text-slate-600">Sign in to track and manage service requests.</p>{params.error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}<form action={signIn} className="mt-8 space-y-5"><label className="block text-sm font-medium">Email<input name="email" type="email" required className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" /></label><label className="block text-sm font-medium">Password<input name="password" type="password" required className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" /></label><Submit label="Sign in" /></form><p className="mt-6 text-sm text-slate-600">New to Tatua? <Link className="font-semibold text-teal-700" href="/register">Create an account</Link></p></section></main>;
}
