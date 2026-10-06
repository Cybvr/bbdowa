"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { Building2 } from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useAuth } from "@/components/auth-provider";
import { NAV_ACTIVE, NAV_TEXT } from "@/components/dashboard-sidebar";
import { BriefcaseIcon, HomeIcon, MessagesIcon, NjeriIcon, PaymentsIcon, type NavIconComponent } from "@/components/nav-icons";
import { ProfileNav, useProfileImage } from "@/components/profile-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createGlyphAvatarDataUri } from "@/lib/avatar";
import { firebaseDb } from "@/lib/firebase/client";
import type { Client } from "@/lib/clients";

const PORTAL_NAV: { href: string; label: string; mobileLabel?: string; icon: NavIconComponent }[] = [
  { href: "/portal", label: "Home", icon: HomeIcon },
  { href: "/portal/jobs", label: "Jobs", icon: BriefcaseIcon },
  { href: "/portal/company", label: "Company Profile", mobileLabel: "Company", icon: CompanyIcon },
  { href: "/portal/payments", label: "Payments", icon: PaymentsIcon },
  { href: "/portal/njeri", label: "Njeri", icon: NjeriIcon },
  { href: "/portal/messages", label: "Messages", icon: MessagesIcon },
];

function CompanyIcon({ className }: { className?: string }) {
  return <Building2 aria-hidden="true" className={className} strokeWidth={1.75} />;
}

const isCurrent = (pathname: string, href: string) => (href === "/portal" ? pathname === "/portal" : pathname.startsWith(href));

const PortalContext = React.createContext<{ clientId: string; client: Client | null } | null>(null);

/** The signed-in client user's company. Only available inside the portal. */
export function usePortalClient() {
  return React.useContext(PortalContext);
}

function PortalNavList({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {PORTAL_NAV.map((item) => {
        const current = isCurrent(pathname, item.href);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link href={item.href} onClick={onNavigate} aria-current={current ? "page" : undefined} title={collapsed ? item.label : undefined} className={`${NAV_TEXT} ${collapsed ? "justify-center px-0" : ""} ${current ? NAV_ACTIVE : ""}`}>
              <Icon className="h-5 w-5 shrink-0 nav:h-4 nav:w-4" />
              <span className={`overflow-hidden text-ellipsis whitespace-nowrap transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The client portal frame. It uses the dashboard's own sidebar, top bar and
 * bottom bar so it looks the same, with navigation for the client workspace.
 * Only client users (or an admin viewing as one) get in.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, clientId, loading, logout, isViewingAs, stopViewingAs } = useAuth();
  const [client, setClient] = React.useState<Client | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const profileImage = useProfileImage(user?.uid ?? null);

  React.useEffect(() => {
    setSidebarCollapsed(false);
  }, [pathname]);

  React.useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/portal/login");
    // Signed in but no account yet: finish client sign-up by creating the company.
    else if (!role) router.replace("/portal/signup/company");
    else if (role !== "client") router.replace("/dashboard");
  }, [loading, role, router, user]);

  React.useEffect(() => {
    if (!clientId) return;
    return onSnapshot(
      doc(firebaseDb, "clients", clientId),
      (snapshot) => setClient(snapshot.exists() ? ({ slug: snapshot.id, ...snapshot.data() } as Client) : null),
      () => setClient(null),
    );
  }, [clientId]);

  if (loading || !user || role !== "client") return null;

  const displayName = user.name ?? user.email?.split("@")[0] ?? "Client";
  const avatar = profileImage || createGlyphAvatarDataUri(displayName);
  const pageTitle = PORTAL_NAV.find((item) => isCurrent(pathname, item.href))?.label ?? "Home";
  const jobDetailPage = /^\/portal\/jobs\/(?!new(?:\/|$))[^/]+(?:\/|$)/.test(pathname);
  const conversationPage = pathname === "/portal/njeri" || pathname === "/portal/messages";
  const profileNav = (collapsed = false, inMobileMenu = false) => (
    <div className={`w-full shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
      <ProfileNav
        variant={collapsed ? "avatar" : "row"}
        showRole
        showChevron={!collapsed}
        menuAlign="start"
        menuSide="bottom"
        items={[{ label: "Company Profile", href: "/portal/company", icon: <CompanyIcon className="h-4 w-4" />, onSelect: inMobileMenu ? () => setMenuOpen(false) : undefined }]}
        onLogout={() => {
          if (inMobileMenu) setMenuOpen(false);
          void logout();
        }}
      />
    </div>
  );
  const logo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/bbdo-west-africa.png" alt="BBDO West Africa" className="block h-auto w-[clamp(112px,10vw,138px)] max-w-full brightness-0" />
  );

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background nav:flex-row">
      {/* Desktop sidebar, same frame as the dashboard */}
      <nav aria-label="Portal" className={`hidden flex-col gap-2 overflow-y-auto border-r border-border bg-background p-2.5 text-foreground transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] nav:fixed nav:inset-y-4 nav:left-4 nav:flex ${sidebarCollapsed ? "nav:w-[64px]" : "nav:w-[256px]"}`}>
        <div className={`flex min-h-9 items-center gap-2 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          <Link href="/portal" aria-label="BBDO West Africa portal" className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"}`}>{logo}</Link>
          <button
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {sidebarCollapsed ? <LuChevronRight aria-hidden="true" className="h-4 w-4" /> : <LuChevronLeft aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>
        {profileNav(sidebarCollapsed)}
        <PortalNavList collapsed={sidebarCollapsed} />
      </nav>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-background px-[max(18px,env(safe-area-inset-left))] py-3 nav:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" aria-label="Open menu" className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[280px] flex-col gap-2 p-2.5">
              <SheetHeader className="p-1.5">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                {logo}
              </SheetHeader>
              {profileNav(false, true)}
              <PortalNavList onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="m-0 truncate text-[20px] font-bold leading-tight tracking-tight">{pageTitle}</h1>
        </div>
        {isViewingAs ? <button type="button" onClick={stopViewingAs} className="inline-flex h-9 items-center rounded-lg border border-primary/30 bg-primary/5 px-2.5 text-[11px] font-semibold text-primary">Exit view</button> : null}
      </div>

      <div className={`min-w-0 flex-1 pb-16 transition-[margin-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] nav:pb-0 ${sidebarCollapsed ? "nav:ml-[80px]" : "nav:ml-[272px]"}`}>
        <main className={jobDetailPage ? "min-h-[calc(100dvh-60px)] w-full bg-muted px-4 pb-24 pt-6 sm:px-8" : conversationPage ? "w-full" : "mx-auto w-full max-w-5xl px-5 pb-16 pt-4 sm:px-8 nav:pt-8"}>
          {clientId ? (
            <PortalContext.Provider value={{ clientId, client }}>{children}</PortalContext.Provider>
          ) : (
            <div className="rounded-xl border border-border p-6 text-center">
              <h2 className="m-0 text-item-title font-semibold">Your account isn’t linked to a company yet</h2>
              <p className="mb-0 mt-2 text-sm text-muted-foreground">Ask your BBDO West Africa contact to link it, then sign in again.</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom bar, same as the dashboard footer */}
      <nav aria-label="Portal" className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur nav:hidden">
        {PORTAL_NAV.map((item) => {
          const current = isCurrent(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium no-underline ${current ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-6 w-6" />
              <span className="w-full truncate px-0.5 text-center">{item.mobileLabel ?? item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
