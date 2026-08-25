"use client";

import { useEffect, useState } from "react";

/**
 * Renders today's date in the visitor's locale. Deferred to an effect so the
 * server-rendered markup and the first client render always match.
 */
export function Today() {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  return <span>{today}</span>;
}
