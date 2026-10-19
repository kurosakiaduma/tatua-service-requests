// Renders when a requested resource cannot be found, with a link back home.
import Link from "next/link";

// Renders an accessible not-found page matching the app's light and dark themes.
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold text-foreground">Not found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Go back home
      </Link>
    </main>
  );
}
