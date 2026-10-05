import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Mobile: 44px tap target, 15px text (also keeps iOS Safari from
        // auto-zooming on focus, which kicks in below 16px). See DESIGN.md.
        "flex h-11 w-full rounded-sm border border-input bg-transparent px-3 py-1 text-[15px] shadow-none transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Input };
