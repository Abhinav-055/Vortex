import { StreamClient } from "@stream-io/node-sdk";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_SECRET_KEY = process.env.STREAM_SECRET_KEY;

if (!STREAM_API_KEY) {
  throw new Error("NEXT_PUBLIC_STREAM_API_KEY is missing");
}

if (!STREAM_SECRET_KEY) {
  throw new Error("STREAM_SECRET_KEY is missing");
}

export const streamServerClient = new StreamClient(
  STREAM_API_KEY,
  STREAM_SECRET_KEY
);
