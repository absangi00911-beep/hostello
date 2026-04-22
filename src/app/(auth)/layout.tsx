import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — dark brand side ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-shrink-0 flex-col justify-between bg-[var(--color-ink)] relative overflow-hidden p-12">

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />

        {/* Green glow */}
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 blur-[80px] pointer-events-none"
          style={{ background: "radial-gradient(circle,#00DC62 0%,transparent 70%)" }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="relative">
          <Logo solid={false} size="md" />
        </div>

        {/* Headline */}
        <div className="relative">
          <p className="text-xs font-bold tracking-widest text-[var(--color-brand-500)] uppercase mb-5">
            Pakistan&apos;s verified hostel marketplace
          </p>
          <h2
            className="text-4xl xl:text-5xl font-extrabold text-white leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            The only hostel search that checks listings in person.
          </h2>
          <p className="mt-5 text-white/45 text-base leading-relaxed">
            Every hostel on HostelLo has been visited by our team. Reviews come from residents who actually stayed. You deal directly with the owner.
          </p>

          {/* Social proof */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["H","S","A","F","M"].map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[var(--color-ink)] bg-[var(--color-brand-700)] flex items-center justify-center text-xs font-bold text-white"
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/40">
              Joined this week
            </p>
          </div>
        </div>

        {/* Bottom links */}
        <div className="relative flex items-center gap-4 text-xs text-white/25">
          <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          <span>·</span>
          <span>© {new Date().getFullYear()} HostelLo</span>
        </div>
      </div>

      {/* ── Right panel — form side ── */}
      <div className="flex-1 flex flex-col min-h-screen bg-[var(--color-ground)]">
        {/* Mobile header */}
        <header className="lg:hidden px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <Logo solid size="md" />
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          {children}
        </main>

        <footer className="lg:hidden px-6 py-4 text-center">
          <p className="text-xs text-[var(--color-muted)]">
            © {new Date().getFullYear()} HostelLo ·{" "}
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            {" · "}
            <Link href="/terms" className="hover:underline">Terms</Link>
          </p>
        </footer>
      </div>

    </div>
  );
}
