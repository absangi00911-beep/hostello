import Image from "next/image";

interface HostelRoom {
  id: string;
  name: string;
  description: string | null;
  pricePerMonth: number;
  capacity: number;
  available: number;
  images: string[];
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(
    amount,
  );
}

export function HostelRoomSection({ rooms }: { rooms: HostelRoom[] }) {
  return (
    <section
      aria-labelledby="hostel-rooms-title"
      className="hostel-room-section hostel-detail-overview-section"
    >
      <h2 id="hostel-rooms-title" className="mb-3 text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">
        Where you’ll sleep
      </h2>
      {rooms.length > 0 ? (
        <ul className="hostel-room-grid grid list-none gap-5 p-0 [grid-template-columns:repeat(2,minmax(0,1fr))] md:[grid-template-columns:repeat(2,minmax(0,1fr))] max-md:[grid-template-columns:1fr]">
          {rooms.map((room) => {
            const photo = room.images
              .map((image) => image.trim())
              .find((image) => image.length > 0);
            const description = room.description?.trim();

            return (
              <li className="hostel-room-card min-w-0" key={room.id}>
                <div className="hostel-room-photo relative aspect-[1.45] overflow-hidden rounded-lg bg-surface-muted">
                  {photo ? (
                    <Image
                      alt={`${room.name} room`}
                      className="object-cover"
                      fill
                      sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 25vw"
                      src={photo}
                    />
                  ) : (
                    <div
                      aria-label={`No photo available for ${room.name}`}
                      className="hostel-room-photo-fallback grid h-full w-full place-items-center text-[0.84rem] text-muted"
                      role="img"
                    >
                      Room photo unavailable
                    </div>
                  )}
                </div>
                <div className="hostel-room-info pt-2.5">
                  <h3 className="m-0 text-[0.95rem] font-semibold leading-[1.35] text-ink [overflow-wrap:anywhere]">
                    {room.name}
                  </h3>
                  <p className="hostel-room-capacity mt-1.5 text-[0.82rem] leading-[1.5] text-muted">
                    Up to {room.capacity} {" "}
                    {room.capacity === 1 ? "resident" : "residents"}
                  </p>
                  {description && (
                    <p className="hostel-room-description mt-1.5 text-[0.82rem] leading-[1.5] text-muted">
                      {description}
                    </p>
                  )}
                  <p className="hostel-room-price mt-1.5 text-[0.82rem] leading-[1.5] text-muted">
                    <strong className="font-semibold text-ink">PKR {formatPrice(room.pricePerMonth)}</strong> per month
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="hostel-room-empty m-0 text-[0.9rem] text-muted" role="status">
          No rooms are currently available.
        </p>
      )}
    </section>
  );
}
