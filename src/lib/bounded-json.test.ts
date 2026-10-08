import { describe, expect, it } from "vitest";
import { readBoundedFormData, readBoundedJson, readBoundedText } from "@/lib/bounded-json";

function request(body: string, headers: Record<string, string> = {}) {
  return new Request("https://hostello.pk/api/test", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

describe("readBoundedJson", () => {
  it("parses a JSON body within its byte limit", async () => {
    await expect(readBoundedJson(request('{"ok":true}'), 20)).resolves.toEqual({
      ok: true,
      data: { ok: true },
    });
  });

  it("rejects an oversized declared body before reading it", async () => {
    await expect(readBoundedJson(request("{}", { "content-length": "100" }), 20)).resolves.toEqual({
      ok: false,
      status: 413,
      error: "Request body is too large.",
    });
  });

  it("rejects an oversized streamed body when no content length is supplied", async () => {
    await expect(readBoundedJson(request('{"value":"1234567890"}'), 10)).resolves.toEqual({
      ok: false,
      status: 413,
      error: "Request body is too large.",
    });
  });

  it("returns a client error for missing or malformed JSON", async () => {
    await expect(readBoundedJson(new Request("https://hostello.pk/api/test"), 20)).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
    await expect(readBoundedJson(request("{"), 20)).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Invalid JSON request body.",
    });
  });
});

describe("readBoundedText", () => {
  it("returns the exact text within its byte limit", async () => {
    await expect(readBoundedText(request('{"event":"payment.succeeded"}'), 64)).resolves.toEqual({
      ok: true,
      text: '{"event":"payment.succeeded"}',
    });
  });

  it("rejects an oversized declared raw body before reading it", async () => {
    await expect(readBoundedText(request("{}", { "content-length": "100" }), 20)).resolves.toEqual({
      ok: false,
      status: 413,
      error: "Request body is too large.",
    });
  });

  it("rejects an oversized chunked raw body", async () => {
    await expect(readBoundedText(request("0123456789"), 8)).resolves.toEqual({
      ok: false,
      status: 413,
      error: "Request body is too large.",
    });
  });
});

describe("readBoundedFormData", () => {
  const boundary = "hostello-test-boundary";
  const contentType = `multipart/form-data; boundary=${boundary}`;
  const multipartBody = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="label"',
    "",
    "bounded upload",
    `--${boundary}--`,
    "",
  ].join("\r\n");

  function multipartRequest(body: string) {
    return new Request("https://hostello.pk/api/upload", {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    });
  }

  it("parses multipart fields within its byte limit", async () => {
    const result = await readBoundedFormData(multipartRequest(multipartBody), 256);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.get("label")).toBe("bounded upload");
  });

  it("rejects oversized multipart streams without a content length", async () => {
    const result = await readBoundedFormData(multipartRequest(multipartBody), 32);
    expect(result).toEqual({
      ok: false,
      status: 413,
      error: "Request body is too large.",
    });
  });
});
