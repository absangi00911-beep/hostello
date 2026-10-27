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
      <h2 id="hostel-rooms-title">Where you’ll sleep</h2>
      {rooms.length > 0 ? (
        <ul className="hostel-room-grid">
          {rooms.map((room) => {
            const photo = room.images
              .map((image) => image.trim())
              .find((image) => image.length > 0);
            const description = room.description?.trim();

            return (
              <li className="hostel-room-card" key={room.id}>
                <div className="hostel-room-photo">
                  {photo ? (
                    <Image
                      alt={`${room.name} room`}
                      fill
                      sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 25vw"
                      src={photo}
                    />
                  ) : (
                    <div
                      aria-label={`No photo available for ${room.name}`}
                      className="hostel-room-photo-fallback"
                      role="img"
                    >
                      Room photo unavailable
                    </div>
                  )}
                </div>
                <div className="hostel-room-info">
                  <h3>{room.name}</h3>
                  <p className="hostel-room-capacity">
                    Up to {room.capacity}{" "}
                    {room.capacity === 1 ? "resident" : "residents"}
                  </p>
                  {description && (
                    <p className="hostel-room-description">{description}</p>
                  )}
                  <p className="hostel-room-price">
                    <strong>PKR {formatPrice(room.pricePerMonth)}</strong> per month
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="hostel-room-empty" role="status">
          No rooms are currently available.
        </p>
      )}
    </section>
  );
}
