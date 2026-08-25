import Link from "next/link";

const BASE =
  "inline-flex min-h-[44px] items-center text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground no-underline before:mr-[9px] before:h-2.5 before:w-[18px] before:bg-primary before:content-[''] before:[clip-path:polygon(35%_0,35%_40%,100%_40%,100%_60%,35%_60%,35%_100%,0_50%)] hover:text-primary focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-primary";

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
      {children}
    </Link>
  );
}
