// shareUrlUtils.ts
import { Buffer } from "buffer";

interface ShareOptions {
  shareBy: string;
  type: "document" | "webpage" | "batchResource";
  resourceId: string;
  maxViews: number;
  baseUrl: string;
}

// Generate encoded share URL
export function generateShareUrl({
  shareBy,
  type,
  resourceId,
  maxViews,
  baseUrl,
}: ShareOptions): { encodedUrl: string; meta: any } {
  const expiryTime = new Date(); // Set expiry time to 7 days from now
  expiryTime.setDate(expiryTime.getDate() + 7); // Set expiry to 7 days
  const payload = {
    t: type,
    r: resourceId,
    s: shareBy,
    e: expiryTime?.toISOString(),
    m: maxViews || null,
    ts: new Date().toISOString(),
  };

  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const shareUrl = `${baseUrl}/share/verify/${encoded}`;

  return {
    encodedUrl: shareUrl,
    meta: payload,
  };
}

// Decode share URL
export function decodeShareUrl(encoded: string): {
  t: "document" | "webpage" | "batchResource";
  r: string;
  s: string;
  e: string;
  m: number | null;
  ts: string;
} {
  try {
    // Pad the string with '=' to make its length a multiple of 4
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const json = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch (err) {
    throw new Error("Invalid encoded share URL");
  }
}
