'use client';

import { CheckCircle, Clock } from 'lucide-react';

interface Room {
  id: string;
  type: string;
  description: string;
  occupancy: string;
  availability: {
    status: 'available' | 'limited' | 'unavailable';
    message: string;
  };
  price: number;
  highlight?: boolean;
}

const rooms: Room[] = [
  {
    id: '1',
    type: 'Single Executive',
    description: 'Attached bath, AC',
    occupancy: '1 Person',
    availability: {
      status: 'available',
      message: '2 Available',
    },
    price: 45000,
  },
  {
    id: '2',
    type: 'Double Shared',
    description: 'Attached bath, AC',
    occupancy: '2 Persons',
    availability: {
      status: 'limited',
      message: '1 Bed Left',
    },
    price: 30000,
    highlight: true,
  },
  {
    id: '3',
    type: 'Triple Shared',
    description: 'Common bath, Non-AC',
    occupancy: '3 Persons',
    availability: {
      status: 'available',
      message: '4 Beds Available',
    },
    price: 22000,
  },
];

export function RoomsTable() {
  return (
    <div className="bg-bg-card rounded-xl border border-border-default overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container border-b border-border-default">
            <th className="py-space-3 px-space-4 font-overline text-overline text-text-muted uppercase">Room Type</th>
            <th className="py-space-3 px-space-4 font-overline text-overline text-text-muted uppercase">Occupancy</th>
            <th className="py-space-3 px-space-4 font-overline text-overline text-text-muted uppercase">Availability</th>
            <th className="py-space-3 px-space-4 font-overline text-overline text-text-muted uppercase text-right">Price (PKR/mo)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {rooms.map((room) => (
            <tr
              key={room.id}
              className={`hover:bg-bg-raised transition-colors cursor-pointer ${room.highlight ? 'bg-primary-faint/30' : ''}`}
            >
              <td className="py-space-4 px-space-4">
                <div className="flex flex-col">
                  <span className="font-label text-label text-text-heading">{room.type}</span>
                  <span className="text-xs text-text-muted">{room.description}</span>
                </div>
              </td>
              <td className="py-space-4 px-space-4 text-text-body">{room.occupancy}</td>
              <td className="py-space-4 px-space-4">
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${
                    room.availability.status === 'available'
                      ? 'text-success'
                      : room.availability.status === 'limited'
                        ? 'text-warning'
                        : 'text-error'
                  }`}
                >
                  {room.availability.status === 'limited' ? (
                    <Clock className="w-[16px] h-[16px]" />
                  ) : (
                    <CheckCircle className="w-[16px] h-[16px]" />
                  )}
                  {room.availability.message}
                </span>
              </td>
              <td className="py-space-4 px-space-4 text-right font-label text-label text-primary-deep">{room.price.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
