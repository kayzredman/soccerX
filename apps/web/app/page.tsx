import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
        <p className="font-mono text-xs uppercase tracking-widest text-pitch-500">
          World Cup 2026 • USA · Canada · Mexico
        </p>
        <h1 className="mt-3 text-5xl font-bold leading-tight tracking-tight">
          SoccerX
        </h1>
        <p className="mt-4 max-w-xl text-lg text-neutral-600">
          Predict. Compete. Brag. A 39-day companion game built around the
          tournament — not a static bracket.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card
          href="/bracket"
          title="Build your bracket"
          body="Pick group winners, the 8 best third-placed teams, fill the knockouts."
        />
        <Card
          href="/leaderboard"
          title="See the leaderboard"
          body="Global, country, and mini-league rankings update as matches finish."
        />
        <Card
          href="/daily"
          title="Today's bonus picks"
          body="Open every match-day for quick predictions worth extra points."
        />
        <Card
          href="/league"
          title="Create a mini-league"
          body="Invite friends with an 8-character code. Beat them publicly."
        />
      </section>

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
        v0.1 • design source of truth: <code>docs/PROJECT.md</code>
      </footer>
    </main>
  );
}

function Card({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href as never}
      className="group block rounded-2xl border border-neutral-200 p-5 transition hover:border-pitch-500 hover:shadow-sm"
    >
      <h2 className="font-semibold text-ink group-hover:text-pitch-900">
        {title}
      </h2>
      <p className="mt-1 text-sm text-neutral-600">{body}</p>
    </Link>
  );
}
