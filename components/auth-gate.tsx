export function AuthGate() {
  return (
    <div className="max-w-[400px] mx-auto w-full text-center flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Sign in to continue</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Create a free account to track your progress, and save your solutions.
      </p>
    </div>
  );
}
