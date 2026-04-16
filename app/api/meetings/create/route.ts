import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-errors";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { streamServerClient } from "@/lib/stream-server";

export const runtime = "nodejs";

interface CreateMeetingBody {
  title?: string;
  description?: string;
  scheduledAt?: string;
}

export const POST = withApiHandler(async (request, { userId }) => {
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await currentUser();
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new ApiError(400, "User email not found");
  }

  const body = (await request.json()) as CreateMeetingBody;
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  const title = body.title?.trim() || "Instant Meeting";
  const description = body.description?.trim() || "Instant Meeting";

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email,
      name: user.fullName || user.username || userId,
      avatarUrl: user.imageUrl,
    },
    create: {
      id: userId,
      email,
      name: user.fullName || user.username || userId,
      avatarUrl: user.imageUrl,
    },
  });

  const streamCallId = crypto.randomUUID();
  const streamCall = streamServerClient.video.call("default", streamCallId);

  await streamCall.getOrCreate({
    data: {
      created_by_id: userId,
      starts_at: scheduledAt?.toISOString(),
      custom: {
        title,
        description,
      },
    },
  });

  const meeting = await prisma.meeting.create({
    data: {
      title,
      description,
      streamCallId,
      hostId: userId,
      scheduledAt,
      status: "SCHEDULED",
      participants: {
        create: {
          userId,
        },
      },
    },
  });

  return NextResponse.json({
    meetingId: meeting.id,
    streamCallId,
    joinUrl: `/meeting/${streamCallId}`,
  });
});
