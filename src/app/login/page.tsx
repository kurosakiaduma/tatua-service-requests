import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/app/actions";
import { Submit } from "@/app/auth-form";
import { Hero } from "@/app/hero";
import { ThemeToggle } from "@/app/theme-toggle";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Server-rendered sign-in page that forwards authentication to a server action.
export const instant = false;
/** Renders the sign-in form and any authentication error from the URL. */
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  return (
    <main className="relative min-h-screen bg-background">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="hidden lg:block">
          <Hero
            eyebrow="Welcome back"
            title="Keep your community moving forward."
            description="Sign in to see your reports, share updates and follow each issue through to resolution."
          />
        </div>
        <section className="mx-auto w-full max-w-md rounded-3xl border bg-card p-7 shadow-sm sm:p-9">
          <Link href="/" className="text-lg font-bold text-primary">
            Tatua
          </Link>
          <h1 className="mt-8 text-3xl font-bold text-card-foreground">Sign in</h1>
          <p className="mt-2 text-muted-foreground">Use your Tatua account to continue.</p>
          {params.error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {params.error}
            </p>
          )}
          <form action={signIn} className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-card-foreground">
              Email
              <input
                name="email"
                type="email"
                required
                className="mt-2 min-h-12 w-full rounded-xl border bg-background px-3 text-foreground"
              />
            </label>
            <label className="block text-sm font-semibold text-card-foreground">
              Password
              <input
                name="password"
                type="password"
                required
                className="mt-2 min-h-12 w-full rounded-xl border bg-background px-3 text-foreground"
              />
            </label>
            <Submit label="Sign in" />
          </form>
          <div className="mt-6 border-t pt-6">
            <p className="text-sm font-semibold text-card-foreground">Reviewing this project?</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Try the admin demo", email: "admin@tatua.demo" },
                { label: "Try the citizen demo", email: "citizen@tatua.demo" },
              ].map((demo) => (
                <form key={demo.email} action={signIn}>
                  <input type="hidden" name="email" value={demo.email} />
                  <input type="hidden" name="password" value="TatuaDemo123!" />
                  <button className="min-h-12 w-full rounded-xl border px-3 text-sm font-semibold text-foreground hover:bg-muted">
                    {demo.label}
                  </button>
                </form>
              ))}
            </div>
          </div>
          <p className="mt-7 text-sm text-muted-foreground">
            New to Tatua?{" "}
            <Link className="font-bold text-primary hover:underline" href="/register">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
