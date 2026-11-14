import { beforeEach, describe, expect, it, vi } from "vitest";

const s3 = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@aws-sdk/client-s3", () => {
  class Command {
    constructor(readonly input: Record<string, unknown>) {}
  }
  return {
    S3Client: class { send = s3.send; },
    ListObjectsV2Command: class ListObjectsV2Command extends Command {},
    DeleteObjectsCommand: class DeleteObjectsCommand extends Command {},
    CopyObjectCommand: class extends Command {},
    DeleteObjectCommand: class extends Command {},
    GetObjectCommand: class extends Command {},
    HeadObjectCommand: class extends Command {},
    PutObjectCommand: class extends Command {},
  };
});

import { deleteExpiredVerificationUploads, listVerificationDocuments } from "./verification-storage";

const HOUR = 60 * 60 * 1000;
const hex = (n: number) => n.toString(16).padStart(32, "0");
const key = (user: string, n: number) => `student-verification-uploads/${user}/${hex(n)}.jpg`;
const obj = (Key: string, ageMs: number) => ({ Key, LastModified: new Date(Date.now() - ageMs) });

describe("deleteExpiredVerificationUploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("R2_ACCOUNT_ID", "acct");
    vi.stubEnv("R2_VERIFICATION_ACCESS_KEY_ID", "id");
    vi.stubEnv("R2_VERIFICATION_SECRET_ACCESS_KEY", "secret");
    vi.stubEnv("R2_VERIFICATION_BUCKET_NAME", "private-bucket");
  });

  it("finds expired uploads that sit beyond the first page of 1000 keys", async () => {
    // S3 lists alphabetically, not by age: 1000 fresh uploads can come first.
    const fresh = Array.from({ length: 1000 }, (_, i) => obj(key("aaa", i), 5 * 60 * 1000));
    const expired = [obj(key("zzz", 1), 3 * HOUR), obj(key("zzz", 2), 2 * HOUR)];
    const deleted: string[][] = [];

    s3.send.mockImplementation(async (command: { constructor: { name: string }; input: Record<string, any> }) => {
      if (command.constructor.name === "ListObjectsV2Command") {
        return command.input.ContinuationToken === "page-2"
          ? { Contents: expired, IsTruncated: false }
          : { Contents: fresh, IsTruncated: true, NextContinuationToken: "page-2" };
      }
      deleted.push(command.input.Delete.Objects.map((o: { Key: string }) => o.Key));
      return {};
    });

    const count = await deleteExpiredVerificationUploads();

    expect(count).toBe(2);
    expect(deleted.flat().sort()).toEqual([key("zzz", 1), key("zzz", 2)]);
  });

  it("deletes nothing and makes no delete call when nothing has expired", async () => {
    s3.send.mockResolvedValue({ Contents: [obj(key("aaa", 1), 60_000)], IsTruncated: false });

    expect(await deleteExpiredVerificationUploads()).toBe(0);
    expect(s3.send).toHaveBeenCalledTimes(1);
  });

  it("stops after a bounded number of pages instead of looping forever", async () => {
    s3.send.mockResolvedValue({ Contents: [], IsTruncated: true, NextContinuationToken: "again" });

    await deleteExpiredVerificationUploads();

    expect(s3.send.mock.calls.length).toBeLessThanOrEqual(50);
  });

  it("still reports a failure if S3 could not delete some expired uploads", async () => {
    s3.send.mockImplementation(async (command: { constructor: { name: string } }) =>
      command.constructor.name === "ListObjectsV2Command"
        ? { Contents: [obj(key("aaa", 1), 3 * HOUR)], IsTruncated: false }
        : { Errors: [{ Key: key("aaa", 1), Code: "AccessDenied" }] });

    await expect(deleteExpiredVerificationUploads()).rejects.toThrow("could not be deleted");
  });
});

describe("listVerificationDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("R2_ACCOUNT_ID", "acct");
    vi.stubEnv("R2_VERIFICATION_ACCESS_KEY_ID", "id");
    vi.stubEnv("R2_VERIFICATION_SECRET_ACCESS_KEY", "secret");
    vi.stubEnv("R2_VERIFICATION_BUCKET_NAME", "private-bucket");
  });

  const docKey = (user: string, n: number) => `student-verifications/${user}/${hex(n)}.pdf`;

  it("follows every page and returns only well-formed submitted-document keys", async () => {
    const seen: Array<string | undefined> = [];
    s3.send.mockImplementation(async (command: { input: Record<string, any> }) => {
      seen.push(command.input.ContinuationToken);
      return command.input.ContinuationToken === "page-2"
        ? { Contents: [obj(docKey("u2", 2), HOUR)], IsTruncated: false }
        : {
            Contents: [
              obj(docKey("u1", 1), HOUR),
              obj("student-verifications/u1/not-a-document.txt", HOUR),
              obj(key("u1", 9), HOUR),
              { Key: docKey("u3", 3) },
            ],
            IsTruncated: true,
            NextContinuationToken: "page-2",
          };
    });

    const documents = await listVerificationDocuments();

    expect(documents.map((d) => d.key)).toEqual([docKey("u1", 1), docKey("u2", 2)]);
    expect(seen).toEqual([undefined, "page-2"]);
    expect(documents[0].lastModified).toBeInstanceOf(Date);
  });
});
