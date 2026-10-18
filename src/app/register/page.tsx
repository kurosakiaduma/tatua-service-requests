import Link from "next/link";
import { signUp } from "@/app/actions";
import { Submit } from "@/app/auth-form";
import { Hero } from "@/app/hero";
import { ThemeToggle } from "@/app/theme-toggle";

// Server-rendered registration page for new citizen accounts.
export const instant = false;
/** Renders the registration form and any validation error from the URL. */
export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="relative min-h-screen bg-background">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="order-2 mx-auto w-full max-w-md rounded-3xl border bg-card p-7 shadow-sm sm:p-9 lg:order-1">
          <Link href="/" className="text-lg font-bold text-primary">
            Tatua
          </Link>
          <h1 className="mt-8 text-3xl font-bold text-card-foreground">Create your account</h1>
          <p className="mt-2 text-muted-foreground">
            Report a local issue and help your community resolve it.
          </p>
          {params.error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {params.error}
            </p>
          )}
          <form action={signUp} className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-card-foreground">
              Full name
              <input
                name="fullName"
                required
                className="mt-2 min-h-12 w-full rounded-xl border bg-background px-3 text-foreground"
              />
            </label>
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
                minLength={8}
                required
                className="mt-2 min-h-12 w-full rounded-xl border bg-background px-3 text-foreground"
              />
              <span className="mt-2 block text-xs text-muted-foreground">
                At least 8 characters.
              </span>
            </label>
            <Submit label="Create account" />
          </form>
          <p className="mt-7 text-sm text-muted-foreground">
            Already registered?{" "}
            <Link className="font-bold text-primary hover:underline" href="/login">
              Sign in
            </Link>
          </p>
        </section>
        <div className="order-1 lg:order-2">
          <Hero
            eyebrow="Make it count"
            title="Your report can start a change."
            description="A good location and a few clear details help service teams act faster."
          />
        </div>
      </div>
    </main>
  );
}
