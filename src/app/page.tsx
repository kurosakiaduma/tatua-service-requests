export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <section className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          Tatua
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Public service requests, resolved together.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Report a local issue and follow its progress from submission to
          resolution. The application foundation is ready for the citizen and
          administrator workflows.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
          <a className="rounded-lg bg-teal-700 px-5 py-3 text-white hover:bg-teal-800" href="/register">Report an issue</a>
          <a className="rounded-lg border border-slate-300 px-5 py-3 text-slate-800 hover:bg-slate-50" href="/login">Sign in</a>
          <a
            className="rounded-lg border border-transparent px-5 py-3 text-slate-600 hover:text-teal-700"
            href="/api/health"
          >
            System health
          </a>
        </div>
      </section>
    </main>
  );
}
