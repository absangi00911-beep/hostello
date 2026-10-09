import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function NotFound() {
  return (
    <PublicLayout>
      <section className="not-found-field-page container-app py-8 md:py-12">
        <div className="not-found-field-note">
          <div className="not-found-field-meta" aria-hidden="true">
            <span>HOSTELLO FIELD GUIDE</span>
            <span>ROUTE / 404</span>
          </div>

          <div className="not-found-field-copy">
            <p className="not-found-field-kicker">A PAGE HAS GONE MISSING</p>
            <h1 className="not-found-field-title">This path doesn’t lead anywhere.</h1>
            <p className="not-found-field-description">
              The page may have moved, or the address may be off. Let’s get you back to the good part.
            </p>
            <div className="not-found-field-actions">
              <Link href="/hostels" className="not-found-primary-action">
                Explore hostels <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/" className="not-found-home-action">
                Return home
              </Link>
            </div>
          </div>

          <div className="not-found-field-stamp" aria-hidden="true">
            <span>404</span>
            <small>NO SUCH PLACE</small>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
