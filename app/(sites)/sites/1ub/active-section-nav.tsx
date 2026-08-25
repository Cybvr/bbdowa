"use client";

import { useEffect } from "react";

export default function ActiveSectionNav() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        '.section-menu a[href^="#"]',
      ),
    );
    const items = links
      .map((link) => ({
        link,
        section: document.querySelector<HTMLElement>(link.hash),
      }))
      .filter(
        (item): item is { link: HTMLAnchorElement; section: HTMLElement } =>
          Boolean(item.section),
      );

    if (!header || !items.length) return;

    let frame = 0;
    const updateActiveLink = () => {
      frame = 0;
      const line = header.getBoundingClientRect().height + 8;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      let active = items[0];

      if (atBottom) {
        active = items[items.length - 1];
      } else {
        items.forEach((item) => {
          if (item.section.getBoundingClientRect().top <= line) active = item;
        });
      }

      links.forEach((link) => link.removeAttribute("aria-current"));
      active.link.setAttribute("aria-current", "true");
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveLink);
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    updateActiveLink();

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
