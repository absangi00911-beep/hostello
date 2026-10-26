const LOGIN_CALLBACK_ORIGIN = "https://hostello.invalid";

export function getSafeLoginCallbackUrl(value: string | string[] | undefined) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/";
  }

  let callback: URL;
  try {
    callback = new URL(value, LOGIN_CALLBACK_ORIGIN);
  } catch {
    return "/";
  }

  if (callback.origin !== LOGIN_CALLBACK_ORIGIN || callback.pathname !== "/messages") {
    return "/";
  }

  const entries = [...callback.searchParams.entries()];
  if (
    entries.length === 1 &&
    entries[0][0] === "pendingInquiry" &&
    entries[0][1] === "1"
  ) {
    return "/messages?pendingInquiry=1";
  }

  if (
    entries.length === 1 &&
    entries[0][0] === "conversationId" &&
    /^[A-Za-z0-9_-]{1,128}$/.test(entries[0][1])
  ) {
    return `/messages?conversationId=${encodeURIComponent(entries[0][1])}`;
  }

  return entries.length === 0 ? "/messages" : "/";
}
