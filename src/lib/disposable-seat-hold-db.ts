const DISPOSABLE_CONFIRMATION = "I_UNDERSTAND_THIS_DATABASE_IS_DISPOSABLE";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function getDatabaseIdentity(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("A PostgreSQL database URL is invalid.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("A PostgreSQL database URL is invalid.");
  }

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    throw new Error("A PostgreSQL database URL is invalid.");
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLocal = LOCAL_HOSTS.has(hostname);
  return {
    hostname: isLocal ? "loopback" : hostname,
    isLocal,
    port: parsed.port || "5432",
    databaseName,
  };
}

type DisposableDatabaseOptions = {
  url: string | undefined;
  confirmation: string | undefined;
  applicationDatabaseUrl?: string;
};

export function getDisposableSeatHoldTestDatabaseUrl({
  url,
  confirmation,
  applicationDatabaseUrl,
}: DisposableDatabaseOptions): string {
  if (!url || confirmation !== DISPOSABLE_CONFIRMATION) {
    throw new Error("An explicit disposable PostgreSQL test database is required.");
  }

  const identity = getDatabaseIdentity(url);
  if (
    !identity.isLocal ||
    !/(?:^|[_-])(?:test|disposable)(?:$|[_-])/i.test(identity.databaseName)
  ) {
    throw new Error("Only a local, separately named disposable test database is allowed.");
  }

  if (applicationDatabaseUrl) {
    const applicationIdentity = getDatabaseIdentity(applicationDatabaseUrl);
    if (
      identity.hostname === applicationIdentity.hostname &&
      identity.port === applicationIdentity.port &&
      identity.databaseName === applicationIdentity.databaseName
    ) {
      throw new Error("Only a local, separately named disposable test database is allowed.");
    }
  }

  return url;
}
