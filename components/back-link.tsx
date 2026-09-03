import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";

const BASE =
  "inline-flex min-h-[36px] items-center gap-1.5 text-[13px] font-medium text-muted-foreground no-underline hover:text-foreground focus-visible:text-foreground focus-visible:outline-none";

export function BackLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${BASE} ${className}`}>
      <LuArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
      {children}
    </Link>
  );
}
