"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  LISTING_LIMITS,
  emptyRoom,
  roomFieldKey,
  type ListingFormErrors,
  type RoomFormValues,
} from "./listingForm";
import {
  Field,
  controlProps,
  fieldClassName,
  secondaryButtonClassName,
} from "./ListingFormFields";

export function ListingRoomsEditor({
  errors,
  onChange,
  rooms,
}: {
  errors: ListingFormErrors;
  onChange: (rooms: RoomFormValues[]) => void;
  rooms: RoomFormValues[];
}) {
  function update(index: number, patch: Partial<RoomFormValues>) {
    onChange(rooms.map((room, i) => (i === index ? { ...room, ...patch } : room)));
  }

  return (
    <div className="grid gap-4">
      {errors.rooms ? (
        <p className="m-0 text-[0.85rem] text-[#c13515]" role="alert">
          {errors.rooms}
        </p>
      ) : null}
      <ol className="m-0 grid list-none gap-4 p-0">
        {rooms.map((room, index) => {
          const err = (field: string) => errors[roomFieldKey(index, field)];
          const id = (field: string) => `room-${index}-${field}`;
          return (
            <li
              className="grid gap-3 rounded-[12px] border border-line bg-canvas p-4"
              key={room.id ?? `new-${index}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 text-[0.95rem] font-semibold text-ink">
                  Room type {index + 1}
                </h3>
                <button
                  aria-label={`Remove room type ${index + 1}`}
                  className={`${secondaryButtonClassName} gap-1`}
                  disabled={rooms.length === 1}
                  onClick={() => onChange(rooms.filter((_, i) => i !== index))}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                  Remove
                </button>
              </div>
              <Field error={err("name")} id={id("name")} label="Room name">
                <input
                  {...controlProps(id("name"), err("name"))}
                  className={fieldClassName}
                  maxLength={LISTING_LIMITS.roomNameMax}
                  onChange={(event) => update(index, { name: event.currentTarget.value })}
                  placeholder="e.g. 4-seater with attached bath"
                  type="text"
                  value={room.name}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  error={err("pricePerMonth")}
                  hint="Per bed, per month"
                  id={id("price")}
                  label="Price per month (Rs.)"
                >
                  <input
                    {...controlProps(id("price"), err("pricePerMonth"), "Per bed, per month")}
                    className={fieldClassName}
                    inputMode="numeric"
                    onChange={(event) =>
                      update(index, { pricePerMonth: event.currentTarget.value })
                    }
                    type="text"
                    value={room.pricePerMonth}
                  />
                </Field>
                <Field error={err("capacity")} id={id("capacity")} label="Beds in this room type">
                  <input
                    {...controlProps(id("capacity"), err("capacity"))}
                    className={fieldClassName}
                    inputMode="numeric"
                    onChange={(event) => update(index, { capacity: event.currentTarget.value })}
                    type="text"
                    value={room.capacity}
                  />
                </Field>
              </div>
              <Field
                error={err("description")}
                id={id("description")}
                label="Description (optional)"
              >
                <textarea
                  {...controlProps(id("description"), err("description"))}
                  className={`${fieldClassName} min-h-[72px] resize-y`}
                  maxLength={LISTING_LIMITS.roomDescriptionMax}
                  onChange={(event) =>
                    update(index, { description: event.currentTarget.value })
                  }
                  value={room.description}
                />
              </Field>
              <Field
                error={err("facilities")}
                hint="Separate with commas, e.g. Study desk, Wardrobe, Fan"
                id={id("facilities")}
                label="Facilities (optional)"
              >
                <input
                  {...controlProps(
                    id("facilities"),
                    err("facilities"),
                    "Separate with commas, e.g. Study desk, Wardrobe, Fan",
                  )}
                  className={fieldClassName}
                  onChange={(event) => update(index, { facilities: event.currentTarget.value })}
                  type="text"
                  value={room.facilities}
                />
              </Field>
            </li>
          );
        })}
      </ol>
      <div>
        <button
          className={`${secondaryButtonClassName} gap-2`}
          disabled={rooms.length >= LISTING_LIMITS.roomsMax}
          onClick={() => onChange([...rooms, emptyRoom()])}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Add another room type
        </button>
      </div>
    </div>
  );
}
