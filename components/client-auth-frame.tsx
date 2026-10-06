/** A plain centred card for the client sign-in pages. */
export function ClientAuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bbdo-west-africa.png" alt="BBDO West Africa" className="mb-6 h-auto w-32 brightness-0" />
        {children}
      </div>
    </main>
  );
}
