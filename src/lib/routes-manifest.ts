type RoutesManifest = {
  dataRoutes?: unknown[];
  [key: string]: unknown;
};

export function ensureRoutesManifestShape<T extends RoutesManifest>(manifest: T) {
  if (Array.isArray(manifest.dataRoutes)) {
    return manifest;
  }

  return {
    ...manifest,
    dataRoutes: [],
  };
}
