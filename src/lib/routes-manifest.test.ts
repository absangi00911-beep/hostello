import assert from "node:assert/strict";
import test from "node:test";

import { ensureRoutesManifestShape } from "./routes-manifest";

test("ensureRoutesManifestShape adds an empty dataRoutes array when Next omits it", () => {
  const manifest = {
    version: 3,
    caseSensitive: false,
    basePath: "",
    rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
    redirects: [],
    headers: [],
  };

  const normalized = ensureRoutesManifestShape(manifest);

  assert.deepEqual(normalized.dataRoutes, []);
});

test("ensureRoutesManifestShape preserves existing data routes", () => {
  const manifest = {
    version: 3,
    caseSensitive: false,
    basePath: "",
    rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
    redirects: [],
    headers: [],
    dataRoutes: [{ page: "/test", dataRouteRegex: "^/_next/data/.+$" }],
  };

  const normalized = ensureRoutesManifestShape(manifest);

  assert.deepEqual(normalized.dataRoutes, manifest.dataRoutes);
});
