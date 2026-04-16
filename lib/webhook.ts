import crypto from "crypto";

const STREAM_WEBHOOK_SECRET = process.env.STREAM_WEBHOOK_SECRET;

if (!STREAM_WEBHOOK_SECRET) {
  throw new Error("STREAM_WEBHOOK_SECRET is missing");
}

const normalizeSignature = (signature: string) => {
  return signature.replace(/^sha256=/i, "").trim();
};

const safeEqualString = (left: string, right: string) => {
  const leftBuffer = new Uint8Array(Buffer.from(left, "utf8"));
  const rightBuffer = new Uint8Array(Buffer.from(right, "utf8"));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const verifyStreamWebhookSignature = (
  rawBody: string,
  signatureHeader: string | null
) => {
  if (!signatureHeader) {
    return false;
  }

  const signature = normalizeSignature(signatureHeader);

  const digestHex = crypto
    .createHmac("sha256", STREAM_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const digestBase64 = crypto
    .createHmac("sha256", STREAM_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("base64");

  return safeEqualString(signature, digestHex) || safeEqualString(signature, digestBase64);
};
