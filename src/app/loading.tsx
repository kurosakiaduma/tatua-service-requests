// Subtle loading indicator shown while route content streams in.
// Renders a lightweight loading fallback matching the app's themes.
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  );
}
