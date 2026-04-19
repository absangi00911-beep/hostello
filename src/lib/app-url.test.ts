import assert from "node:assert/strict";
import test from "node:test";

import { getAppUrl, getRequestOrigin } from "./app-url";

test("getAppUrl trims trailing slashes and prefers configured public URLs", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;

  process.env.NEXT_PUBLIC_APP_URL = "https://preview.hostello.app/";
  assert.equal(getAppUrl(), "https://preview.hostello.app");

  if (previous === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});

test("getRequestOrigin prefers forwarded headers so deployed links use the live host", () => {
  const request = new Request("http://localhost:3000/api/auth/forgot-password", {
    headers: {
      "x-forwarded-proto": "https",
      "x-forwarded-host": "hostello.vercel.app",
    },
  });

  assert.equal(getRequestOrigin(request), "https://hostello.vercel.app");
});
