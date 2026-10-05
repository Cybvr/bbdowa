import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // 15px avoids iOS Safari auto-zoom on focus (kicks in below 16px). See DESIGN.md.
        "flex min-h-[60px] w-full rounded-sm border border-input bg-transparent px-3 py-2 text-[15px] shadow-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
