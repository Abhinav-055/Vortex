import crypto from "crypto";

export interface SignedRecordingPayload {
  recordingId: string;
  userId: string;
  exp: number;
}

const SIGNING_SECRET = process.env.SIGNING_SECRET;

if (!SIGNING_SECRET) {
  throw new Error("SIGNING_SECRET is missing");
}

const toBase64Url = (value: string) => Buffer.from(value).toString("base64url");

const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString();

const createSignature = (payload: string) => {
  return crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payload)
    .digest("base64url");
};

export const signRecordingPayload = (payload: SignedRecordingPayload) => {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createSignature(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const verifyRecordingToken = (token: string): SignedRecordingPayload => {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    throw new Error("Invalid recording token");
  }

  const expectedSignature = createSignature(encodedPayload);

  const providedBuffer = new Uint8Array(Buffer.from(signature, "utf8"));
  const expectedBuffer = new Uint8Array(
    Buffer.from(expectedSignature, "utf8")
  );

  if (providedBuffer.length !== expectedBuffer.length) {
    throw new Error("Invalid recording token signature");
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new Error("Invalid recording token signature");
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload)) as SignedRecordingPayload;

  if (Date.now() > payload.exp) {
    throw new Error("Recording token expired");
  }

  return payload;
};
