import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { CITIES } from "@/config/amenities";

const LINKS = {
  product: [
    { label: "Browse hostels",    href: "/hostels" },
    { label: "List your hostel",  href: "/signup?role=owner" },
    { label: "How it works",      href: "/how-it-works" },
    { label: "About",             href: "/about" },
    { label: "Pricing",           href: "/pricing" },
  ],
  support: [
    { label: "Help centre",       href: "/help" },
    { label: "Contact us",        href: "/contact" },
    { label: "Report an issue",   href: "/report" },
  ],
  legal: [
    { label: "Terms",             href: "/terms" },
    { label: "Privacy",           href: "/privacy" },
    { label: "Cookies",           href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[var(--color-ink)] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo solid={false} size="md" />
            {/* HUMANIZED: removed "Safe, affordable, and close to your university" (rule of three with adjectives) */}
            <p className="mt-4 text-sm text-white/45 leading-relaxed max-w-xs">
              Verified hostels near universities across Pakistan. Book directly with the owner — no agents, no markups.
            </p>

            {/* Social */}
            <div className="mt-6 flex items-center gap-2.5">
              <SocialLink href="https://instagram.com/hostello.pk" label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </SocialLink>
              <SocialLink href="https://twitter.com/hostello_pk" label="X / Twitter">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </SocialLink>
              <SocialLink href="https://facebook.com/hostello.pk" label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </SocialLink>
            </div>
          </div>

          {/* Product links */}
          <FooterCol title="Product" links={LINKS.product} />

          {/* Support links */}
          <FooterCol title="Support" links={LINKS.support} />

          {/* Cities */}
          <div>
            <h3 className="text-xs font-bold tracking-widest text-white/30 uppercase mb-4">
              Cities
            </h3>
            <ul className="space-y-2.5">
              {CITIES.map((city) => (
                <li key={city}>
                  <Link
                    href={`/cities/${city.toLowerCase()}`}
                    className="text-sm text-white/45 hover:text-white transition-colors"
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} HostelLo. Made in Pakistan 🇵🇰
          </p>
          <div className="flex items-center gap-5">
            {LINKS.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold tracking-widest text-white/30 uppercase mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/45 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href, label, children,
}: {
  href: string; label: string; children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-xl bg-white/8 border border-white/8 flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white transition-all"
    >
      {children}
    </a>
  );
}
