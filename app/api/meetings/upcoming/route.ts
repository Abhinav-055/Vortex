import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = withApiHandler(async (_request, { userId }) => {
  const now = new Date();

  const allMeetings = await prisma.meeting.findMany({
    where: {
      participants: {
        some: { userId: userId! },
      },
    },
    include: {
      participants: {
        select: { id: true },
      },
    },
  });

  type MeetingWithParticipants = (typeof allMeetings)[number];

  const meetings = allMeetings
    .filter((meeting: MeetingWithParticipants) => {
      const meetingTime = meeting.scheduledAt || meeting.createdAt;
      return meetingTime > now;
    })
    .sort((a: MeetingWithParticipants, b: MeetingWithParticipants) => {
      const aTime = (a.scheduledAt || a.createdAt).getTime();
      const bTime = (b.scheduledAt || b.createdAt).getTime();
      return aTime - bTime;
    });

  const hostIds = Array.from(
    new Set(meetings.map((meeting: MeetingWithParticipants) => meeting.hostId))
  );
  const hosts = await prisma.user.findMany({
    where: {
      id: {
        in: hostIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const hostMap = new Map(
    hosts.map((host: { id: string; name: string | null }) => [
      host.id,
      host.name || host.id,
    ])
  );

  return NextResponse.json({
    meetings: meetings.map((meeting: MeetingWithParticipants) => ({
      id: meeting.id,
      streamCallId: meeting.streamCallId,
      title: meeting.title,
      scheduledAt: (meeting.scheduledAt || meeting.createdAt).toISOString(),
      status: meeting.status,
      participantCount: meeting.participants.length,
      hostName: hostMap.get(meeting.hostId) || meeting.hostId,
    })),
  });
});
