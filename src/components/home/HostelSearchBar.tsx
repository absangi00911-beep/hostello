"use client";

import { Search, X } from "lucide-react";
import { useRef, useState, type FormEvent, type MouseEvent } from "react";

export function HostelSearchBar({
  onSearch,
}: {
  onSearch: (destination: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const searchDialogRef = useRef<HTMLDialogElement>(null);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(destination.trim());
    if (searchDialogRef.current?.open) {
      searchDialogRef.current.close();
    }
  }

  function renderSearchForm(inDialog: boolean) {
    return (
      <form
        className={`mx-auto grid min-h-16 w-[min(800px,100%)] grid-cols-[1.3fr_1fr_0.85fr_48px] items-center gap-0 rounded-full border border-line bg-white p-[7px] shadow-[0_5px_20px_rgb(29_42_34/9%)] transition-[border-color,box-shadow] duration-[180ms] focus-within:border-[color-mix(in_srgb,var(--brand)_42%,var(--line))] focus-within:shadow-[0_7px_24px_rgb(29_42_34/13%)] [@media(max-width:960px)]:w-[min(640px,100%)] [@media(max-width:720px)]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_44px] [@media(max-width:720px)]:rounded-[23px]${inDialog ? " [@media(max-width:720px)]:mx-0" : " [@media(max-width:720px)]:hidden"}`}
        onSubmit={search}
        role="search"
      >
        <label className="flex min-h-[42px] min-w-0 cursor-text flex-col justify-center gap-px border-r border-line px-[14px] [@media(max-width:720px)]:col-span-full [@media(max-width:720px)]:border-r-0 [@media(max-width:720px)]:border-b [@media(max-width:720px)]:pb-[7px]">
          <span className="text-[0.69rem] leading-[1.3] font-bold text-ink">Where</span>
          <input
            aria-label="Destination"
            autoComplete="off"
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Search destinations"
            className="w-full min-w-0 border-0 bg-transparent p-0 text-[0.76rem] leading-[1.4] text-muted outline-none placeholder:text-muted placeholder:opacity-100"
            type="search"
            value={destination}
          />
        </label>
        <label className="flex min-h-[42px] min-w-0 cursor-text flex-col justify-center gap-px border-r border-line px-[14px] [@media(max-width:720px)]:pl-3">
          <span className="text-[0.69rem] leading-[1.3] font-bold text-ink">Move-in</span>
          <input
            aria-label="Move-in date"
            onChange={(event) => setMoveInDate(event.target.value)}
            className="min-h-[21px] w-full min-w-0 border-0 bg-transparent p-0 text-[0.76rem] leading-[1.4] text-muted outline-none"
            type="date"
            value={moveInDate}
          />
        </label>
        <label className="flex min-h-[42px] min-w-0 cursor-text flex-col justify-center gap-px border-r border-line px-[14px] [@media(max-width:720px)]:border-r-0 [@media(max-width:720px)]:pr-[6px] [@media(max-width:720px)]:pl-3">
          <span className="text-[0.69rem] leading-[1.3] font-bold text-ink">Guests</span>
          <select
            aria-label="Guests"
            onChange={(event) => setGuestCount(event.target.value)}
            className="w-full min-w-0 cursor-pointer border-0 bg-transparent p-0 text-[0.76rem] leading-[1.4] text-muted outline-none"
            value={guestCount}
          >
            {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={String(count)}>
                {count} {count === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </label>
        <button
          aria-label="Search hostels"
          className="col-start-4 grid h-11 w-11 cursor-pointer place-items-center rounded-full border-0 bg-brand text-white transition-[background-color,transform] duration-[160ms] hover:scale-[1.04] hover:bg-brand-dark active:scale-[0.94] [@media(max-width:720px)]:col-start-3 [@media(max-width:720px)]:row-start-2 [@media(max-width:720px)]:h-10 [@media(max-width:720px)]:w-10 [@media(max-width:720px)]:justify-self-center motion-reduce:hover:transform-none! motion-reduce:active:transform-none!"
          type="submit"
        >
          <Search aria-hidden="true" size={18} />
        </button>
      </form>
    );
  }

  return (
    <section
      className="border-b border-line bg-[#fcfcfb] py-[14px] [@media(max-width:720px)]:py-3 [@media(max-width:720px)]:pb-[10px]"
      aria-label="Search stays"
    >
      <button
        aria-label="Start your search"
        className="hidden min-h-14 w-full cursor-pointer items-center justify-center gap-[11px] rounded-full border border-line bg-white px-[18px] py-3 text-[0.94rem] font-semibold text-ink shadow-[0_4px_14px_rgb(29_42_34/8%)] transition-[box-shadow,transform] duration-[180ms] active:scale-[0.99] focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-[3px]! [@media(max-width:720px)]:flex motion-reduce:active:transform-none!"
        onClick={() => searchDialogRef.current?.showModal()}
        type="button"
      >
        <Search aria-hidden="true" size={18} />
        <span>Start your search</span>
      </button>
      <dialog
        aria-label="Search stays"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-white px-4 pt-5 pb-[calc(24px+env(safe-area-inset-bottom))] text-ink [@media(min-width:721px)]:h-auto [&::backdrop]:bg-[rgb(20_30_24/42%)]"
        onClick={(event: MouseEvent<HTMLDialogElement>) => {
          if (event.target === event.currentTarget) {
            searchDialogRef.current?.close();
          }
        }}
        ref={searchDialogRef}
      >
        <div className="mx-auto w-[min(100%,560px)]">
          <div className="mb-5 flex min-h-11 items-center justify-between">
            <h2 className="m-0 text-[1.15rem] font-bold">Search stays</h2>
            <button
              aria-label="Close search"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink"
              onClick={() => searchDialogRef.current?.close()}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
          {renderSearchForm(true)}
          <p className="mt-2 text-center text-[0.7rem] text-muted">
            Move-in date and guests aren&apos;t used to filter availability yet.
          </p>
        </div>
      </dialog>
      {renderSearchForm(false)}
      <p className="mt-2 text-center text-[0.7rem] text-muted [@media(max-width:720px)]:hidden">
        Move-in date and guests aren&apos;t used to filter availability yet.
      </p>
    </section>
  );
}
