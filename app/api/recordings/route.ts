import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { streamServerClient } from "@/lib/stream-server";

export const runtime = "nodejs";

export const GET = withApiHandler(async (_request, { userId }) => {
  const meetings = await prisma.meeting.findMany({
    where: {
      participants: {
        some: {
          userId: userId!,
        },
      },
    },
    select: {
      id: true,
      hostId: true,
      streamCallId: true,
    },
  });

  await Promise.all(
    meetings.map(async (meeting) => {
      try {
        const call = streamServerClient.video.call("default", meeting.streamCallId);
        const streamRecordings = await call.listRecordings();

        await Promise.all(
          streamRecordings.recordings.map(async (recording) => {
            const existingRecording = await prisma.recording.findFirst({
              where: {
                meetingId: meeting.id,
                OR: [
                  {
                    filename: recording.filename,
                  },
                  {
                    rawUrl: recording.url,
                  },
                ],
              },
              select: {
                id: true,
              },
            });

            if (existingRecording) {
              return;
            }

            const durationSecs = Math.max(
              0,
              Math.floor(
                (new Date(recording.end_time).getTime() -
                  new Date(recording.start_time).getTime()) /
                  1000
              )
            );

            await prisma.recording.create({
              data: {
                meetingId: meeting.id,
                uploadedById: meeting.hostId,
                rawUrl: recording.url,
                filename: recording.filename,
                durationSecs,
              },
            });
          })
        );
      } catch (error) {
        console.warn(
          `[api] Failed to sync recordings for call ${meeting.streamCallId}`,
          error
        );
      }
    })
  );

  const recordings = await prisma.recording.findMany({
    where: {
      meeting: {
        participants: {
          some: {
            userId: userId!,
          },
        },
      },
    },
    include: {
      meeting: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    recordings: recordings.map((recording) => ({
      id: recording.id,
      meetingTitle: recording.meeting.title,
      recordedAt: recording.createdAt.toISOString(),
      durationSecs: recording.durationSecs ?? 0,
      signedUrlEndpoint: `/api/recordings/${recording.id}/url`,
    })),
  });
});
