import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = path.join(process.cwd(), ".next", "routes-manifest.json");

try {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);

  if (Array.isArray(manifest.dataRoutes)) {
    process.exit(0);
  }

  manifest.dataRoutes = [];

  await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
  console.warn("[build] Added missing dataRoutes to routes-manifest.json for next start compatibility.");
} catch (err) {
  if (typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT") {
    process.exit(0);
  }

  throw err;
}
