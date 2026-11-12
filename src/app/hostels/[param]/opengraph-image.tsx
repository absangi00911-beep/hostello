import { getHostelShareCard } from "@/lib/hostel-share-card";
import { renderHostelShareImage } from "@/lib/hostel-share-image";

export const alt = "HostelLo hostel listing";
// Literals, because Next.js reads these statically.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ param: string }> }) {
  const { param } = await params;
  let card = null;
  let lookupFailed = false;
  try {
    card = await getHostelShareCard(param);
  } catch {
    // A database error should still return a valid branded image, not a 500,
    // but one that is never cached (see renderHostelShareImage).
    lookupFailed = true;
  }
  return renderHostelShareImage(card, { lookupFailed });
}
