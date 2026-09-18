import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign In — Bantaba | BBDO West Africa",
  description: "Sign in to Bantaba, the West African creator network powered by BBDO West Africa.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPath = typeof params.next === "string" ? params.next : "/dashboard";
  const redirectTo =
    requestedPath.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/dashboard";

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
        <section className="w-full max-w-[440px]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <LoginForm redirectTo={redirectTo} />
          </div>
        </section>
      </main>

    </div>
  );
}
