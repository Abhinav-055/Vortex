"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  scheduledAt?: string;
}

export interface CreateMeetingResponse {
  meetingId: string;
  streamCallId: string;
  joinUrl: string;
}

export interface MeetingsListItem {
  id: string;
  streamCallId: string;
  title: string;
  scheduledAt: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED";
  participantCount: number;
  hostName: string;
}

export interface MeetingsResponse {
  meetings: MeetingsListItem[];
}

export interface RecordingListItem {
  id: string;
  meetingTitle: string;
  recordedAt: string;
  durationSecs: number;
  thumbnailUrl?: string;
  signedUrlEndpoint: string;
}

export interface RecordingsResponse {
  recordings: RecordingListItem[];
}

export interface RecordingUrlResponse {
  url: string;
  expiresAt: string;
}

type TokenGetter = () => Promise<string | null>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const createApiUrl = (path: string) => {
  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin;

    if (!API_BASE_URL) {
      return `${currentOrigin}${path}`;
    }

    const isLocalhostBase =
      API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
    const isCurrentLocalhost =
      currentOrigin.includes("localhost") || currentOrigin.includes("127.0.0.1");

    if (isLocalhostBase && isCurrentLocalhost) {
      return `${currentOrigin}${path}`;
    }
  }

  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
};

const request = async <T>(
  path: string,
  init: RequestInit,
  getToken?: TokenGetter
): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (getToken) {
    const token = await getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(createApiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(errorBody?.error || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

export const createMeeting = (
  payload: CreateMeetingRequest,
  getToken?: TokenGetter
) =>
  request<CreateMeetingResponse>(
    "/api/meetings/create",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    getToken
  );

export const getUpcomingMeetings = (getToken?: TokenGetter) =>
  request<MeetingsResponse>("/api/meetings/upcoming", { method: "GET" }, getToken);

export const getPreviousMeetings = (getToken?: TokenGetter) =>
  request<MeetingsResponse>("/api/meetings/previous", { method: "GET" }, getToken);

export const getRecordings = (getToken?: TokenGetter) =>
  request<RecordingsResponse>("/api/recordings", { method: "GET" }, getToken);

export const getRecordingUrl = (id: string, getToken?: TokenGetter) =>
  request<RecordingUrlResponse>(`/api/recordings/${id}/url`, { method: "GET" }, getToken);

export const useApiClient = () => {
  const { getToken } = useAuth();

  return useMemo(
    () => ({
      createMeeting: (payload: CreateMeetingRequest) => createMeeting(payload, getToken),
      getUpcomingMeetings: () => getUpcomingMeetings(getToken),
      getPreviousMeetings: () => getPreviousMeetings(getToken),
      getRecordings: () => getRecordings(getToken),
      getRecordingUrl: (id: string) => getRecordingUrl(id, getToken),
    }),
    [getToken]
  );
};
