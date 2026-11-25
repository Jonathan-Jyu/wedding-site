import type { RSVPErrorCode } from "./rsvp-errors";

export const MAX_RSVP_BODY_BYTES = 32 * 1024;

// Match the complete media type, including optional token or quoted parameters.
const JSON_CONTENT_TYPE = /^application\/json(?:[ \t]*;[ \t]*[!#$%&'*+.^_\x60|~\w-]+[ \t]*=[ \t]*(?:[!#$%&'*+.^_\x60|~\w-]+|"(?:[\t\x20-\x21\x23-\x5b\x5d-\x7e\x80-\xff]|\\[\t\x20-\x7e\x80-\xff])*"))*$/i;

type RequestResult =
  | { success: true; body: unknown }
  | { success: false; code: RSVPErrorCode };

export async function readRSVPRequest(request: Request): Promise<RequestResult> {
  const contentType = request.headers.get("content-type")?.trim() ?? "";
  const encoding = request.headers.get("content-encoding")?.trim().toLowerCase();
  if (!JSON_CONTENT_TYPE.test(contentType) || (encoding !== undefined && encoding !== "identity")) {
    return { success: false, code: "RSVP_UNSUPPORTED_MEDIA_TYPE" };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_RSVP_BODY_BYTES) {
    return { success: false, code: "RSVP_PAYLOAD_TOO_LARGE" };
  }
  if (!request.body) return { success: false, code: "RSVP_INVALID_JSON" };

  try {
    const reader = request.body.getReader();
    const bytes = new Uint8Array(MAX_RSVP_BODY_BYTES);
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value.byteLength > MAX_RSVP_BODY_BYTES - length) {
          // Cancellation can wait on the transport. The 413 response need not.
          void reader.cancel().catch(() => {});
          return { success: false, code: "RSVP_PAYLOAD_TOO_LARGE" };
        }
        bytes.set(value, length);
        length += value.byteLength;
      }
    } finally {
      reader.releaseLock();
    }

    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length));
    const body: unknown = JSON.parse(json);
    return { success: true, body };
  } catch {
    return { success: false, code: "RSVP_INVALID_JSON" };
  }
}
