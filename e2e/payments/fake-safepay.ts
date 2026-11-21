import { createServer, type IncomingMessage, type Server } from "node:http";
import { FAKE_SAFEPAY } from "./constants";

export interface FakeSafepayRequest {
  method: string;
  path: string;
  originalHost: string | undefined;
  merchantSecret: string | undefined;
  body: unknown;
}

/**
 * A stand-in for the Safepay API, running inside the test process. The app's server reaches
 * it through safepay-network-stub.cjs. It checks the merchant credentials the app sends and
 * hands out tracker tokens, and can be told to fail so outages can be tested.
 */
export class FakeSafepay {
  readonly requests: FakeSafepayRequest[] = [];
  private server: Server | null = null;
  private trackerCount = 0;
  private failures: number[] = [];

  /** The tracker tokens issued so far, oldest first. */
  get trackers(): string[] {
    return this.requests.flatMap((request) => {
      const token = (request as FakeSafepayRequest & { issuedTracker?: string }).issuedTracker;
      return token ? [token] : [];
    });
  }

  /** The checkout-session requests the app made, newest last (excludes the auth-token calls). */
  get sessionRequests(): FakeSafepayRequest[] {
    return this.requests.filter((request) => request.path.startsWith("/order/payments/v3/"));
  }

  /** Forget requests and queued failures between tests. Tracker numbering keeps counting. */
  reset(): void {
    this.requests.length = 0;
    this.failures.length = 0;
  }

  /** Make the next session request fail with this HTTP status (an outage). */
  failNext(status = 503): void {
    this.failures.push(status);
  }

  async start(port: number): Promise<void> {
    this.server = createServer((req, res) => void this.handle(req, res));
    await new Promise<void>((resolve, reject) => {
      this.server!.once("error", reject);
      this.server!.listen(port, "127.0.0.1", resolve);
    });
  }

  async stop(): Promise<void> {
    const server = this.server;
    this.server = null;
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  private async handle(req: IncomingMessage, res: import("node:http").ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    let body: unknown = null;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      body = null;
    }

    const record: FakeSafepayRequest & { issuedTracker?: string } = {
      method: req.method ?? "",
      path: req.url ?? "",
      originalHost: req.headers["x-original-host"] as string | undefined,
      merchantSecret: req.headers["x-sfpy-merchant-secret"] as string | undefined,
      body,
    };
    this.requests.push(record);

    const send = (status: number, payload: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(payload));
    };

    if (req.method === "POST" && req.url?.startsWith("/order/payments/v3/")) {
      const failure = this.failures.shift();
      if (failure) return send(failure, { status: { errors: ["fake outage"] } });
      if (record.merchantSecret !== FAKE_SAFEPAY.secret) return send(401, { status: { errors: ["bad secret"] } });
      if ((body as { merchant_api_key?: string } | null)?.merchant_api_key !== FAKE_SAFEPAY.apiKey) {
        return send(401, { status: { errors: ["bad api key"] } });
      }
      this.trackerCount += 1;
      record.issuedTracker = `track_e2e_${this.trackerCount}_${Date.now().toString(36)}`;
      return send(200, { data: { tracker: { token: record.issuedTracker } } });
    }

    if (req.method === "POST" && req.url?.startsWith("/client/passport/v1/token")) {
      if (record.merchantSecret !== FAKE_SAFEPAY.secret) return send(401, { status: { errors: ["bad secret"] } });
      return send(200, { data: `tbt_e2e_${Date.now().toString(36)}` });
    }

    return send(404, { status: { errors: [`fake Safepay has no route ${req.method} ${req.url}`] } });
  }
}
