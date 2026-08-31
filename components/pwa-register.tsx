"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // PWA support is progressive enhancement; the site remains usable if
        // the browser blocks service workers or registration fails.
      });
    }
  }, []);

  return null;
}
