import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HostelSearchBar } from "./HostelSearchBar";
import { SearchDatePicker } from "./SearchDatePicker";
import { SearchLocationPicker } from "./SearchLocationPicker";
import { SearchPillPanels } from "./SearchPillPanels";
import { SearchPillForm } from "./SearchPillForm";

describe("HostelSearchBar", () => {
  it("renders a mobile search trigger and a full-screen search dialog", () => {
    const markup = renderToStaticMarkup(
      <HostelSearchBar onSearch={vi.fn()} />,
    );

    expect(markup).toContain('aria-label="Start your search"');
    expect(markup).toContain('aria-label="Search stays"');
    expect(markup).toContain('class="fixed inset-0 m-0 h-dvh');
    expect(markup).not.toContain("<span>hostello</span>");
  });

  it("uses a full-width background while keeping search content aligned", () => {
    const markup = renderToStaticMarkup(
      <HostelSearchBar onSearch={vi.fn()} />,
    );

    expect(markup).toMatch(
      /<section class="[^"]*w-full[^"]*bg-surface[^"]*" aria-label="Search stays">/,
    );
    expect(markup).toContain(
      "mx-auto w-[min(1920px,calc(100%-var(--page-gutter-total)))]",
    );
  });

  it("keeps the existing search fields in the desktop and mobile surfaces", () => {
    const markup = renderToStaticMarkup(
      <HostelSearchBar onSearch={vi.fn()} />,
    );

    expect(markup.match(/aria-label="Destination"/g)).toHaveLength(2);
    expect(markup.match(/aria-label="Move-in: Add dates"/g)).toHaveLength(2);
    expect(markup).not.toMatch(/<button[^>]*aria-label="Guests"/);
    expect(markup.match(/aria-label="Search hostels"/g)).toHaveLength(2);
    expect(markup.match(
      /Availability is checked only on the selected move-in date\./g,
    )).toHaveLength(2);
  });

  it("uses three equal sections with the search action grouped with guests", () => {
    const markup = renderToStaticMarkup(
      <HostelSearchBar onSearch={vi.fn()} />,
    );

    expect(markup.match(/grid-cols-3/g)).toHaveLength(2);
    expect(markup.split("before:bg-line").length - 1).toBe(4);
    expect(
      markup.match(
        /<div aria-label="Guests and search"[^>]*role="group">[\s\S]*?Guests[\s\S]*?students?[\s\S]*?aria-label="Search hostels"[\s\S]*?<\/div>/g,
      ),
    )
      .toHaveLength(2);
  });

  it("uses neutral token states without decorative shadows on search controls", () => {
    const markup = renderToStaticMarkup(
      <HostelSearchBar onSearch={vi.fn()} />,
    );

    expect(markup.split("hover:bg-surface-muted").length - 1).toBe(6);
    expect(markup.split("focus-within:bg-surface-muted").length - 1).toBe(4);
    expect(markup).not.toContain("hover:shadow-");
    expect(markup).not.toContain("focus-within:shadow-");
    expect(markup).not.toContain("focus-visible:shadow-");
    expect(markup.split("motion-reduce:transition-none").length - 1).toBe(6);
  });

  it("uses moderate corners and token-based surfaces for the search form", () => {
    const markup = renderToStaticMarkup(
      <SearchPillForm
        activePanel="where"
        destination=""
        inDialog={false}
        moveInDate=""
        onClearDestination={vi.fn()}
        onDestinationChange={vi.fn()}
        onDestinationFocus={vi.fn()}
        onKeyDown={vi.fn()}
        onSubmit={vi.fn()}
        onToggleDate={vi.fn()}
        onToggleStudents={vi.fn()}
        studentCount={1}
      >
        {null}
      </SearchPillForm>,
    );

    expect(markup).toContain("rounded-xl border border-line bg-surface");
    expect(markup).toContain("rounded-lg");
    expect(markup).toContain("bg-surface-muted");
    expect(markup).not.toContain("rounded-full");
    expect(markup).not.toContain("shadow-[");
  });

  it("shows destinations in a compact, icon-led suggestion panel", () => {
    const markup = renderToStaticMarkup(
      <SearchLocationPicker
        destinationSuggestions={["Lahore"]}
        locationError={null}
        onSelectCity={vi.fn()}
        onSelectNearby={vi.fn()}
        query=""
      />,
    );

    expect(markup).toContain("Suggested destinations");
    expect(markup).toContain("Lahore, Pakistan");
    expect(markup).toContain("Explore student stays");
    expect(markup).toContain("size-10");
  });

  it("keeps the search icon outside the student control highlight", () => {
    const markup = renderToStaticMarkup(
      <HostelSearchBar onSearch={vi.fn()} />,
    );
    const forms = markup.match(
      /<form class="[^"]*grid-cols-3[^"]*p-1[^"]*"[^>]*role="search"/g,
    );
    const guestGroups = markup.match(
      /<div aria-label="Guests and search" class="([^"]*)" role="group">/g,
    );
    const searchButtons = markup.match(
      /<button aria-label="Search hostels" class="([^"]*)" type="submit">/g,
    );
    const guestButtons = markup.match(
      /<button aria-expanded="(?:true|false)" class="flex min-h-14 min-w-0 flex-1[^"]*"[^>]*type="button">[\s\S]*?<\/button>/g,
    );

    expect(forms).toHaveLength(2);
    expect(guestGroups).toHaveLength(2);
    expect(guestGroups?.every((group) =>
      !group.includes("hover:bg-[#f2f2f2]"),
    )).toBe(true);
    expect(guestButtons).toHaveLength(2);
    expect(
      guestButtons?.every((button) =>
        button.includes("hover:bg-surface-muted") &&
        button.includes("Guests") &&
        button.includes("student"),
      ),
    ).toBe(true);
    expect(searchButtons).toHaveLength(2);
    expect(searchButtons?.every((button) =>
      !button.includes("bg-[#f2f2f2]"),
    )).toBe(true);
    expect(markup.split("peer-hover/where:before:opacity-0").length - 1).toBe(2);
    expect(markup.split("peer-hover/move-in:before:opacity-0").length - 1).toBe(2);
  });

  it("uses semantic danger styling for destination and nearby-location errors", () => {
    const destinationError = renderToStaticMarkup(
      <SearchPillPanels
        activePanel="where"
        destination=""
        destinationSuggestions={[]}
        locationError="Location unavailable."
        locationStatus="error"
        onChooseCity={vi.fn()}
        onDoneStudents={vi.fn()}
        onSelectCity={vi.fn()}
        onSelectDate={vi.fn()}
        onSelectNearby={vi.fn()}
        onStudentCountChange={vi.fn()}
        searchError={null}
        selectedDate=""
        studentCount={1}
      />,
    );
    const nearbyError = renderToStaticMarkup(
      <SearchPillPanels
        activePanel="date"
        destination="Nearby"
        destinationSuggestions={[]}
        locationError="Location unavailable."
        locationStatus="error"
        onChooseCity={vi.fn()}
        onDoneStudents={vi.fn()}
        onSelectCity={vi.fn()}
        onSelectDate={vi.fn()}
        onSelectNearby={vi.fn()}
        onStudentCountChange={vi.fn()}
        searchError={null}
        selectedDate=""
        studentCount={1}
      />,
    );

    expect(destinationError).toContain("bg-warn-soft");
    expect(destinationError).toContain("text-danger");
    expect(nearbyError).toContain("text-danger");
    expect(destinationError).not.toMatch(/text-\[#(?:9b2c18|a12622)\]/);
    expect(nearbyError).not.toMatch(/text-\[#(?:9b2c18|a12622)\]/);
  });

  it("uses Tailwind utilities for responsive layout, focus, and motion states", () => {
    const markup = renderToStaticMarkup(
      <HostelSearchBar onSearch={vi.fn()} />,
    );

    expect(markup).toContain("grid-cols-3");
    expect(markup).toContain("motion-reduce:hover:transform-none!");
    expect(markup).toContain("focus-visible:outline-2!");
    expect(markup).toContain("h-dvh");
  });

  it("offers exact dates and flexible month selection without unsupported stay lengths", () => {
    const markup = renderToStaticMarkup(
      <SearchDatePicker onSelect={vi.fn()} selectedDate="" />,
    );

    expect(markup).toContain('role="tablist"');
    expect(markup.match(/role="tab"/g)).toHaveLength(2);
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain('aria-controls="search-date-dates-panel"');
    expect(markup).toContain('aria-controls="search-date-flexible-panel"');
    expect(markup).toContain('id="search-date-dates-panel"');
    expect(markup).toContain('aria-labelledby="search-date-dates-tab"');
    expect(markup).toContain("Choose a date");
    expect(markup).toContain("Dates");
    expect(markup).toContain("Flexible");
    expect(markup).not.toContain("Weekend");
    expect(markup).not.toContain("Week");
  });
});
