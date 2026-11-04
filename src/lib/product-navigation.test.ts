import { describe, expect, it } from "vitest";
import {
  getProductNavigationTabs,
  productNavigationTabs,
  type ProductNavigationRole,
  type ProductNavigationTabId,
} from "@/lib/product-navigation";

// Characterization tests: these pin down what getProductNavigationTabs does
// today for every role, in the order the tabs are rendered. If a role's tab set
// changes on purpose, update the matrix below in the same change.

const ALL_TAB_IDS: ProductNavigationTabId[] = [
  "explore",
  "wishlists",
  "trips",
  "messages",
  "profile",
];

const HREF_BY_ID: Record<ProductNavigationTabId, string> = {
  explore: "/",
  wishlists: "/wishlists",
  trips: "/trips",
  messages: "/messages",
  profile: "/profile",
};

type RoleCase = {
  label: string;
  role: ProductNavigationRole;
  visible: ProductNavigationTabId[];
};

const roleMatrix: RoleCase[] = [
  { label: "guest", role: null, visible: ["explore", "wishlists", "profile"] },
  { label: "student", role: "STUDENT", visible: ALL_TAB_IDS },
  { label: "owner", role: "OWNER", visible: ["explore", "messages"] },
  { label: "admin", role: "ADMIN", visible: ["explore"] },
];

describe("productNavigationTabs", () => {
  it("defines the five product tabs in display order with their routes", () => {
    expect(productNavigationTabs.map((tab) => tab.id)).toEqual(ALL_TAB_IDS);
    for (const tab of productNavigationTabs) {
      expect(tab.href).toBe(HREF_BY_ID[tab.id]);
      expect(tab.label.length).toBeGreaterThan(0);
    }
  });
});

describe("getProductNavigationTabs role matrix", () => {
  it.each(roleMatrix)(
    "returns exactly the expected tab ids, in order, for a $label",
    ({ role, visible }) => {
      expect(getProductNavigationTabs(role).map((tab) => tab.id)).toEqual(
        visible,
      );
    },
  );

  it.each(roleMatrix)(
    "returns the expected hrefs for a $label",
    ({ role, visible }) => {
      expect(getProductNavigationTabs(role).map((tab) => tab.href)).toEqual(
        visible.map((id) => HREF_BY_ID[id]),
      );
    },
  );

  it.each(roleMatrix)(
    "never includes a tab outside the shared tab list for a $label",
    ({ role }) => {
      const known = new Set<string>(productNavigationTabs.map((tab) => tab.id));
      for (const tab of getProductNavigationTabs(role)) {
        expect(known.has(tab.id)).toBe(true);
      }
    },
  );

  it.each(roleMatrix)(
    "reuses the shared tab objects (same label and icon) for a $label",
    ({ role }) => {
      for (const tab of getProductNavigationTabs(role)) {
        const shared = productNavigationTabs.find((s) => s.id === tab.id);
        expect(tab).toBe(shared);
        expect(tab.icon).toBe(shared?.icon);
      }
    },
  );

  it.each(roleMatrix)(
    "returns a new array each call so callers cannot mutate the shared list ($label)",
    ({ role }) => {
      const first = getProductNavigationTabs(role);
      const second = getProductNavigationTabs(role);

      expect(first).not.toBe(second);
      expect(first).not.toBe(productNavigationTabs);

      const before = productNavigationTabs.map((tab) => tab.id);
      first.pop();
      expect(productNavigationTabs.map((tab) => tab.id)).toEqual(before);
      expect(getProductNavigationTabs(role).map((tab) => tab.id)).toEqual(
        second.map((tab) => tab.id),
      );
    },
  );

  it("always offers Explore to every role", () => {
    for (const { role } of roleMatrix) {
      expect(getProductNavigationTabs(role).map((tab) => tab.id)).toContain(
        "explore",
      );
    }
  });

  it("shows trips only to students", () => {
    const rolesWithTrips = roleMatrix
      .filter(({ role }) =>
        getProductNavigationTabs(role).some((tab) => tab.id === "trips"),
      )
      .map(({ label }) => label);
    expect(rolesWithTrips).toEqual(["student"]);
  });

  it("shows messages to students and owners but not guests or admins", () => {
    const rolesWithMessages = roleMatrix
      .filter(({ role }) =>
        getProductNavigationTabs(role).some((tab) => tab.id === "messages"),
      )
      .map(({ label }) => label);
    expect(rolesWithMessages).toEqual(["student", "owner"]);
  });

  it("does not link owners or admins to their own dashboards", () => {
    // Characterization: the tab model has no /owner or /admin entry, so those
    // dashboards are not reachable through these tabs for any role.
    for (const { role } of roleMatrix) {
      const hrefs = getProductNavigationTabs(role).map((tab) => tab.href);
      expect(hrefs.some((href) => href.startsWith("/owner"))).toBe(false);
      expect(hrefs.some((href) => href.startsWith("/admin"))).toBe(false);
    }
  });
});
