import Image from "next/image";
import Link from "next/link";

export function HostelloBrand({ className }: { className: string }) {
  return (
    <Link className={className} href="/" aria-label="hostello home">
      <Image
        src="/logo.png"
        alt="Hostello logo"
        width={40}
        height={40}
        className="h-10 w-10 shrink-0"
      />
      <span>hostello</span>
    </Link>
  );
}
