"use client";

/**
 * Lets a page put its title, primary action and search into the mobile top
 * bar. The header owns two empty slots; pages portal into them so their own
 * re-renders never feed back into header state.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type MobileHeaderValue = {
  /** False when the mobile top bar is hidden on this route. */
  enabled: boolean;
  title: string | null;
  setTitle: (title: string | null) => void;
  searchSlot: HTMLElement | null;
  setSearchSlot: (node: HTMLElement | null) => void;
  actionSlot: HTMLElement | null;
  setActionSlot: (node: HTMLElement | null) => void;
};

const MobileHeaderContext = createContext<MobileHeaderValue | null>(null);

export function MobileHeaderProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  const [searchSlot, setSearchSlot] = useState<HTMLElement | null>(null);
  const [actionSlot, setActionSlot] = useState<HTMLElement | null>(null);

  return (
    <MobileHeaderContext.Provider value={{ enabled, title, setTitle, searchSlot, setSearchSlot, actionSlot, setActionSlot }}>
      {children}
    </MobileHeaderContext.Provider>
  );
}

export function useMobileHeader(): MobileHeaderValue | null {
  const value = useContext(MobileHeaderContext);
  return value?.enabled ? value : null;
}

/** Portals `children` into the mobile header's search slot, or renders nothing. */
export function MobileHeaderSearch({ children }: { children: ReactNode }) {
  const header = useMobileHeader();
  return header?.searchSlot ? createPortal(children, header.searchSlot) : null;
}

/** Portals `children` into the mobile header's action (CTA) slot, or renders nothing. */
export function MobileHeaderActions({ children }: { children: ReactNode }) {
  const header = useMobileHeader();
  return header?.actionSlot ? createPortal(children, header.actionSlot) : null;
}

/** Sets the mobile header title while mounted. Renders nothing itself. */
export function MobileHeaderTitle({ title }: { title: string }) {
  const setTitle = useMobileHeader()?.setTitle;
  useEffect(() => {
    if (!setTitle) return;
    setTitle(title);
    return () => setTitle(null);
  }, [setTitle, title]);
  return null;
}

/**
 * Wraps a page heading. On phones the title and action move into the top bar
 * and the in-page copy of them is hidden.
 */
export function MobilePageHeader({
  title,
  action,
  hideAll,
  children,
}: {
  title: string;
  action?: ReactNode;
  /** Hide the whole in-page heading on phones, not just the title and action. */
  hideAll: boolean;
  children: ReactNode;
}) {
  const header = useMobileHeader();
  const setTitle = header?.setTitle;

  useEffect(() => {
    if (!setTitle) return;
    setTitle(title);
    return () => setTitle(null);
  }, [setTitle, title]);

  if (!header) return <>{children}</>;

  return (
    <>
      {action && header.actionSlot ? createPortal(action, header.actionSlot) : null}
      <div className={hideAll ? "max-nav:hidden" : "max-nav:[&_[data-mobile-header]]:hidden"}>{children}</div>
    </>
  );
}
