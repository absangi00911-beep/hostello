'use client';

import { FormEvent, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

interface Room {
  id: string;
  type: 'single' | 'double' | 'triple' | 'quad' | 'dorm';
  quantity: number;
  monthlyPrice: number;
}

interface AddListingRoomsResponsiveProps {
  currentStep?: number;
  totalSteps?: number;
  initialRooms?: Room[];
  onBack?: () => void;
  onNext?: (rooms: Room[]) => void;
  onClose?: () => void;
}

const ROOM_TYPES = [
  { value: 'single', label: 'Single Seater' },
  { value: 'double', label: 'Double Seater' },
  { value: 'triple', label: 'Triple Seater' },
  { value: 'quad', label: 'Quad Seater' },
  { value: 'dorm', label: 'Dormitory' },
];

export function AddListingRoomsResponsive({
  currentStep = 3,
  totalSteps = 5,
  initialRooms = [
    { id: '1', type: 'double', quantity: 12, monthlyPrice: 25000 },
    { id: '2', type: 'triple', quantity: 8, monthlyPrice: 18000 },
  ],
  onBack,
  onNext,
  onClose,
}: AddListingRoomsResponsiveProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [loading, setLoading] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const handleAddRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      type: 'single',
      quantity: 1,
      monthlyPrice: 15000,
    };
    setRooms([...rooms, newRoom]);
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };

  const handleUpdateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(rooms.map((room) => (room.id === id ? { ...room, ...updates } : room)));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (rooms.length === 0) {
      alert('Please add at least one room type');
      return;
    }

    setLoading(true);
    try {
      if (onNext) {
        await onNext(rooms);
      }
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-bg-page text-text-body font-body-default min-h-screen flex flex-col items-center pt-space-12 pb-space-24">
      {/* TopAppBar */}
      <header className="w-full max-w-[1280px] px-space-4 md:px-space-8 mb-space-8 flex items-center justify-between">
        <div className="text-h3 font-h3 text-primary-deep tracking-tight">HostelLo</div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-heading flex items-center gap-space-2 font-label text-label transition-colors"
        >
          <X className="w-5 h-5" />
          Exit Setup
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[800px] px-space-4 md:px-space-0">
        {/* Progress Bar */}
        <div className="mb-space-12">
          <div className="flex justify-between items-center mb-space-2">
            <span className="font-label text-label text-text-muted uppercase tracking-wider">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="font-label text-label text-primary-deep font-semibold">Room Inventory</span>
          </div>
          <div className="w-full h-[6px] bg-border-default rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-deep rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Form Header */}
        <div className="mb-space-8">
          <h1 className="font-h1 text-h1 text-text-heading mb-space-3">Define Your Rooms</h1>
          <p className="font-body-lg text-body-lg text-text-muted">
            Add the types of rooms available in your hostel, their capacity, and the monthly rate in PKR. You can adjust
            this later.
          </p>
        </div>

        {/* Room Inventory Form */}
        <form onSubmit={handleSubmit}>
          {/* Table Area */}
          <div className="bg-bg-card rounded-xl shadow-sm border border-border-default overflow-hidden mb-space-12">
            {/* Table Header (Desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_auto] gap-space-4 p-space-4 bg-bg-raised border-b border-border-default font-label text-label text-text-muted uppercase tracking-wider">
              <div>Room Type</div>
              <div>No. of Rooms</div>
              <div>Monthly Price (PKR)</div>
              <div className="w-[40px]" /> {/* Spacer for delete icon */}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border-default">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onMouseEnter={() => setHoveredRowId(room.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_auto] gap-space-4 md:gap-space-4 p-space-4 md:items-center relative group hover:bg-bg-raised transition-colors"
                >
                  {/* Room Type */}
                  <div className="flex flex-col gap-space-1">
                    <label className="md:hidden font-label text-label text-text-muted">Room Type</label>
                    <select
                      value={room.type}
                      onChange={(e) =>
                        handleUpdateRoom(room.id, { type: e.target.value as Room['type'] })
                      }
                      className="w-full h-[42px] bg-surface-container-lowest border border-border-default rounded focus:ring-2 focus:ring-primary focus:border-primary text-text-body font-body-default px-space-3 outline-none transition-shadow"
                    >
                      {ROOM_TYPES.map((rt) => (
                        <option key={rt.value} value={rt.value}>
                          {rt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* No. of Rooms */}
                  <div className="flex flex-col gap-space-1">
                    <label className="md:hidden font-label text-label text-text-muted">No. of Rooms</label>
                    <input
                      type="number"
                      min="1"
                      value={room.quantity}
                      onChange={(e) =>
                        handleUpdateRoom(room.id, { quantity: parseInt(e.target.value) || 0 })
                      }
                      className="w-full h-[42px] bg-surface-container-lowest border border-border-default rounded focus:ring-2 focus:ring-primary focus:border-primary text-text-body font-body-default px-space-3 outline-none transition-shadow"
                    />
                  </div>

                  {/* Monthly Price */}
                  <div className="flex flex-col gap-space-1">
                    <label className="md:hidden font-label text-label text-text-muted">Monthly Price (PKR)</label>
                    <div className="relative">
                      <span className="absolute left-space-3 top-1/2 -translate-y-1/2 text-text-muted font-body-default">
                        Rs
                      </span>
                      <input
                        type="number"
                        value={room.monthlyPrice}
                        onChange={(e) =>
                          handleUpdateRoom(room.id, { monthlyPrice: parseInt(e.target.value) || 0 })
                        }
                        className="w-full h-[42px] bg-surface-container-lowest border border-border-default rounded focus:ring-2 focus:ring-primary focus:border-primary text-text-body font-body-default pl-space-12 pr-space-3 outline-none transition-shadow"
                      />
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="absolute top-space-4 right-space-4 md:relative md:top-auto md:right-auto flex items-center justify-end w-[40px]">
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      aria-label="Delete room type"
                      className="text-text-placeholder hover:text-error transition-colors p-space-1 rounded-full hover:bg-error-container focus:outline-none focus:ring-2 focus:ring-error"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Row Action */}
            <div className="p-space-4 bg-bg-card border-t border-border-default">
              <button
                type="button"
                onClick={handleAddRoom}
                className="flex items-center gap-space-2 text-primary-deep font-label text-label hover:text-primary transition-colors focus:outline-none focus:underline"
              >
                <Plus className="w-5 h-5" />
                Add Another Room Type
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-space-6 border-t border-border-default">
            <button
              type="button"
              onClick={onBack}
              className="px-space-6 h-[48px] border border-border-strong text-text-heading font-label text-label rounded hover:bg-bg-raised transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-space-8 h-[48px] bg-action text-on-primary font-label text-label rounded shadow-sm hover:translate-y-[-1px] hover:shadow-md active:scale-[0.97] transition-all focus:ring-2 focus:ring-action focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Next Step'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
