import { spawnSync } from "node:child_process";

function run(command) {
  const result = spawnSync(command, { stdio: "inherit", shell: true });

  if (result.error) {
    console.error(`[vercel-build] Could not start ${command}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.VERCEL_ENV === "preview") {
  console.log("[vercel-build] Applying Prisma migrations to the Preview database.");
  run("npm run db:migrate:deploy");
}

run("npm run build");
