import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { verifyStreamWebhookSignature } from "@/lib/webhook";

export const runtime = "nodejs";

interface StreamWebhookEvent {
  type: string;
  call?: {
    id?: string;
    cid?: string;
    custom?: {
      title?: string;
    };
  };
  call_cid?: string;
  user?: {
    id?: string;
  };
  recording?: {
    url?: string;
    filename?: string;
    duration?: number;
  };
}

const getStreamCallId = (event: StreamWebhookEvent) => {
  if (event.call?.id) {
    return event.call.id;
  }

  const cid = event.call?.cid || event.call_cid;

  if (!cid) {
    return null;
  }

  if (cid.includes(":")) {
    return cid.split(":")[1] || null;
  }

  return cid;
};

export const POST = withApiHandler(
  async (request) => {
    const rawBody = await request.text();
    const signature =
      request.headers.get("x-signature") ||
      request.headers.get("x-signature-256") ||
      request.headers.get("x-stream-signature");

    if (!verifyStreamWebhookSignature(rawBody, signature)) {
      throw new ApiError(401, "Invalid webhook signature");
    }

    const event = JSON.parse(rawBody) as StreamWebhookEvent;
    const streamCallId = getStreamCallId(event);

    if (!streamCallId) {
      return NextResponse.json({ ok: true });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { streamCallId },
    });

    if (!meeting) {
      return NextResponse.json({ ok: true });
    }

    if (event.type === "call.started") {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          status: "LIVE",
          startedAt: new Date(),
        },
      });
    }

    if (event.type === "call.ended") {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
        },
      });
    }

    if (event.type === "call.recording_ready" && event.recording?.url) {
      const preferredUploaderId = event.user?.id;
      const knownUploader = preferredUploaderId
        ? await prisma.user.findUnique({ where: { id: preferredUploaderId } })
        : null;

      const uploadedById = knownUploader?.id || meeting.hostId;

      await prisma.recording.create({
        data: {
          meetingId: meeting.id,
          uploadedById,
          rawUrl: event.recording.url,
          filename: event.recording.filename,
          durationSecs: event.recording.duration,
        },
      });
    }

    return NextResponse.json({ ok: true });
  },
  { requireAuth: false }
);
