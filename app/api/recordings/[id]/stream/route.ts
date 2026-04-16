import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { verifyRecordingToken } from "@/lib/signed-url";

export const runtime = "nodejs";

export const GET = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      throw new ApiError(401, "Missing recording token");
    }

    const payload = verifyRecordingToken(token);

    if (payload.recordingId !== params.id) {
      throw new ApiError(403, "Recording token does not match resource");
    }

    const recording = await prisma.recording.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!recording) {
      throw new ApiError(404, "Recording not found");
    }

    return NextResponse.redirect(recording.rawUrl);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status });
  }
};
