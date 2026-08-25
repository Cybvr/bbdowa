"use client";

import { useEffect, useRef, useState } from "react";

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M10 10a3.25 3.25 0 1 0 0-6.5A3.25 3.25 0 0 0 10 10Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.75 17.25c.62-2.72 2.7-4.25 6.25-4.25s5.63 1.53 6.25 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m8.55 2.6.33-.35a1.5 1.5 0 0 1 2.24 0l.33.35c.26.28.64.4 1.02.33l.47-.1a1.5 1.5 0 0 1 1.75 1.4l.03.48c.02.38.24.72.58.9l.42.22a1.5 1.5 0 0 1 .5 2.2l-.3.38c-.23.3-.28.7-.14 1.05l.18.45a1.5 1.5 0 0 1-1.2 2.03l-.48.08a1.1 1.1 0 0 0-.83.65l-.18.45a1.5 1.5 0 0 1-2.2.63l-.4-.27a1.1 1.1 0 0 0-1.07 0l-.4.27a1.5 1.5 0 0 1-2.2-.63l-.18-.45a1.1 1.1 0 0 0-.83-.65l-.48-.08a1.5 1.5 0 0 1-1.2-2.03l.18-.45c.14-.35.09-.75-.14-1.05l-.3-.38a1.5 1.5 0 0 1 .5-2.2l.42-.22c.34-.18.56-.52.58-.9l.03-.48a1.5 1.5 0 0 1 1.75-1.4l.47.1c.38.07.76-.05 1.02-.33Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M8.25 3.25H5.5A1.75 1.75 0 0 0 3.75 5v10A1.75 1.75 0 0 0 5.5 16.75h2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 6.5 14.5 10 11 13.5M14.25 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <div ref={menuRef} className="relative shrink-0" data-profile-menu>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? "Close profile menu" : "Open profile menu"}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center border border-white/45 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-extrabold tracking-[0.04em] text-brand">
          JP
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 top-[calc(100%+10px)] z-[1100] w-[248px] overflow-hidden border border-hairline bg-ink text-white shadow-[0_16px_40px_rgba(0,0,0,0.24)]"
        >
          <div className="flex items-center gap-3 border-b border-white/15 px-4 py-4">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-brand">
              JP
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold">Jide Pinheiro</p>
              <p className="truncate text-[11px] uppercase tracking-[0.08em] text-white/55">
                BBDO West Africa
              </p>
            </div>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={closeMenu}
              className="flex min-h-[42px] w-full items-center gap-3 px-3 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-brand focus-visible:bg-brand focus-visible:outline-none"
            >
              <UserIcon />
              Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={closeMenu}
              className="flex min-h-[42px] w-full items-center gap-3 px-3 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-brand focus-visible:bg-brand focus-visible:outline-none"
            >
              <SettingsIcon />
              Settings
            </button>
          </div>

          <div className="border-t border-white/15 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={closeMenu}
              className="flex min-h-[42px] w-full items-center gap-3 px-3 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-white/75 hover:bg-brand hover:text-white focus-visible:bg-brand focus-visible:text-white focus-visible:outline-none"
            >
              <LogOutIcon />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
