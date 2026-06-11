import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-ink text-white px-6 py-12">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">SoccerX</h1>
          <p className="text-white/60">Pick the bracket. Climb the table.</p>
        </div>
        <SignIn
          routing="hash"
          forceRedirectUrl="/bracket"
          signUpForceRedirectUrl="/bracket"
        />
      </div>
    </main>
  );
}
