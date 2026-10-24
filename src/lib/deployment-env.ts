// Path: src/lib/deployment-env.ts

/**
 * True when this process serves real production traffic.
 *
 * Vercel Preview also runs with NODE_ENV=production, so VERCEL_ENV decides when
 * it is available. Outside Vercel, NODE_ENV=production counts as production.
 */
export function isProductionDeployment(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    env.VERCEL_ENV === "production" ||
    (env.VERCEL_ENV === undefined && env.NODE_ENV === "production")
  );
}
