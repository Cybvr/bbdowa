import Image from "next/image";

export function NjeriMark({ className }: { className?: string }) {
  return <Image src="/njeri-character.png" alt="" aria-hidden="true" width={971} height={1620} className={className} />;
}
