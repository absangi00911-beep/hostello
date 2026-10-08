export type BoundedJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 413; error: string };

export type BoundedTextResult =
  | { ok: true; text: string }
  | { ok: false; status: 400 | 413; error: string };

export type BoundedFormDataResult =
  | { ok: true; data: FormData }
  | { ok: false; status: 400 | 413; error: string };

type BoundedBodyResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; status: 400 | 413; error: string };

/** Read request bytes while enforcing a limit, including chunked bodies. */
async function readBoundedBody(
  request: Request,
  maxBytes: number,
): Promise<BoundedBodyResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredBytes = Number(contentLength);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      return { ok: false, status: 413, error: "Request body is too large." };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400, error: "A request body is required." };

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, status: 413, error: "Request body is too large." };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, bytes };
}

/** Read bounded UTF-8 text without first buffering an unbounded request body. */
export async function readBoundedText(
  request: Request,
  maxBytes: number,
): Promise<BoundedTextResult> {
  const body = await readBoundedBody(request, maxBytes);
  if (!body.ok) return body;
  return { ok: true, text: new TextDecoder().decode(body.bytes) };
}

/** Read and parse multipart data while enforcing a byte limit for chunked bodies too. */
export async function readBoundedFormData(
  request: Request,
  maxBytes: number,
): Promise<BoundedFormDataResult> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    return { ok: false, status: 400, error: "Expected a multipart form request." };
  }

  const body = await readBoundedBody(request, maxBytes);
  if (!body.ok) return body;

  try {
    const bodyBuffer = new ArrayBuffer(body.bytes.byteLength);
    new Uint8Array(bodyBuffer).set(body.bytes);
    const boundedRequest = new Request(request.url, {
      method: request.method,
      headers: { "content-type": contentType },
      body: bodyBuffer,
    });
    return { ok: true, data: await boundedRequest.formData() };
  } catch {
    return { ok: false, status: 400, error: "Invalid multipart form request." };
  }
}

/** Read and parse JSON while enforcing a byte limit, including chunked bodies. */
export async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<BoundedJsonResult> {
  const body = await readBoundedBody(request, maxBytes);
  if (!body.ok) return body;
  try {
    return { ok: true, data: JSON.parse(new TextDecoder().decode(body.bytes)) };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON request body." };
  }
}
