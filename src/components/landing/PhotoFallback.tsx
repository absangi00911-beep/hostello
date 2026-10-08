import { BedDouble } from "lucide-react";

/** Decorative room illustration shown underneath a remote photo if it fails. */
export function PhotoFallback({ dark = false }: { dark?: boolean }) {
  return (
    <div
      aria-hidden="true"
      data-image-fallback
      className={`absolute inset-0 overflow-hidden ${
        dark
          ? "bg-[linear-gradient(145deg,#3b3432_0%,#242324_100%)]"
          : "bg-[linear-gradient(145deg,#f5f0e9_0%,#e8ddd2_100%)]"
      }`}
    >
      <div className={`absolute -right-[10%] -top-[26%] h-[82%] w-[70%] rounded-full blur-3xl ${dark ? "bg-[var(--color-primary)]/20" : "bg-white/70"}`} />
      <div className={`absolute left-[13%] top-[14%] h-[36%] w-[27%] rounded-lg border-[6px] ${dark ? "border-white/25 bg-slate-400/20" : "border-white/80 bg-sky-100/75"}`}>
        <div className={`absolute inset-y-0 left-1/2 w-px ${dark ? "bg-white/20" : "bg-white/80"}`} />
        <div className={`absolute inset-x-0 top-1/2 h-px ${dark ? "bg-white/20" : "bg-white/80"}`} />
      </div>
      <div className={`absolute bottom-[16%] left-[24%] h-[34%] w-[57%] rounded-t-[28px] ${dark ? "bg-[#d5c4b7]/90" : "bg-[#fffaf4]/95"}`}>
        <div className={`absolute inset-x-[6%] top-[16%] h-[28%] rounded-xl ${dark ? "bg-[#9f8b7d]" : "bg-[#e8d8cc]"}`} />
        <div className={`absolute inset-x-0 bottom-0 h-[32%] rounded-t-xl ${dark ? "bg-[#b9a696]" : "bg-[#d9c2b1]"}`} />
      </div>
      <BedDouble
        size={42}
        strokeWidth={1.1}
        className={`absolute bottom-[10%] right-[12%] ${dark ? "text-white/35" : "text-[color:var(--color-primary-deep)]/35"}`}
      />
    </div>
  );
}
