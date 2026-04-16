import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-errors";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { signRecordingPayload } from "@/lib/signed-url";

export const runtime = "nodejs";

export const GET = withApiHandler<{ params: { id: string } }>(
  async (_request, { userId, params }) => {
  const recordingId = params.id;

  if (!recordingId) {
    throw new ApiError(400, "Recording ID is required");
  }

  const recording = await prisma.recording.findUnique({
    where: { id: recordingId },
    include: {
      meeting: {
        include: {
          participants: {
            where: { userId: userId! },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!recording) {
    throw new ApiError(404, "Recording not found");
  }

  if (recording.meeting.participants.length === 0) {
    throw new ApiError(403, "You do not have access to this recording");
  }

  const expiresAt = Date.now() + 60 * 60 * 1000;
  const token = signRecordingPayload({
    recordingId,
    userId: userId!,
    exp: expiresAt,
  });

  return NextResponse.json({
    url: `/api/recordings/${recordingId}/stream?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(expiresAt).toISOString(),
  });
  }
);
