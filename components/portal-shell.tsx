"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, Home, Menu, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import type { Client } from "@/lib/clients";

const PORTAL_NAV = [
  { href: "/portal", label: "Home", icon: Home },
  { href: "/portal/jobs", label: "Jobs", icon: Briefcase },
  { href: "/portal/payments", label: "Payments", icon: Wallet },
] as const;

function PortalNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Portal" className="grid gap-1">
      {PORTAL_NAV.map((item) => {
        const current = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={current ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium no-underline transition ${current ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

const PortalContext = React.createContext<{ clientId: string; client: Client | null } | null>(null);

/** The signed-in client user's company. Only available inside the portal. */
export function usePortalClient() {
  return React.useContext(PortalContext);
}

/**
 * The client portal frame: a simple header with the company name and a sign-out,
 * without any of the agency dashboard. Only client users (or an admin viewing as one) get in.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, clientId, loading, logout, isViewingAs, stopViewingAs } = useAuth();
  const [client, setClient] = React.useState<Client | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth/login?next=/portal");
    else if (role !== "client") router.replace("/dashboard");
  }, [loading, role, router, user]);

  React.useEffect(() => {
    if (!clientId) return;
    let active = true;
    getDoc(doc(firebaseDb, "clients", clientId))
      .then((snapshot) => { if (active) setClient(snapshot.exists() ? ({ slug: snapshot.id, ...snapshot.data() } as Client) : null); })
      .catch(() => { if (active) setClient(null); });
    return () => { active = false; };
  }, [clientId]);

  if (loading || !user || role !== "client") return null;

  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-2">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button type="button" aria-label="Open menu" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-foreground hover:bg-muted md:hidden">
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <SheetHeader className="p-0 pb-4">
              <SheetTitle>{client?.name ?? "Client portal"}</SheetTitle>
            </SheetHeader>
            <PortalNav onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/portal" className="flex min-w-0 items-center gap-3 text-foreground no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bbdo-west-africa.png" alt="BBDO West Africa" className="h-6 w-auto shrink-0" />
          <span className="truncate text-sm font-semibold">{client?.name ?? "Client portal"}</span>
        </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isViewingAs ? (
            <button type="button" onClick={stopViewingAs} className="h-9 rounded-lg border border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary">Exit view</button>
          ) : (
            <button type="button" onClick={() => void logout()} className="h-9 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground">Sign out</button>
          )}
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6">
      <aside className="hidden w-52 shrink-0 px-4 pt-6 md:block">
        <PortalNav />
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-8 md:pl-0">
        {clientId ? (
          <PortalContext.Provider value={{ clientId, client }}>{children}</PortalContext.Provider>
        ) : (
          <div className="rounded-xl border border-border bg-background p-6 text-center">
            <h1 className="m-0 text-item-title font-semibold">Your account isn’t linked to a company yet</h1>
            <p className="mb-0 mt-2 text-sm text-muted-foreground">Ask your BBDO West Africa contact to link it, then sign in again.</p>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
