"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApiClient, type MeetingsListItem } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

const Previous = () => {
  const router = useRouter();
  const { getPreviousMeetings } = useApiClient();
  const [meetings, setMeetings] = useState<MeetingsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreviousMeetings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getPreviousMeetings();
        setMeetings(response.meetings);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPreviousMeetings();
  }, [getPreviousMeetings]);

  if (isLoading) {
    return <div className="text-white">Loading previous meetings...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  return (
    <section className="flex flex-col gap-4 text-white">
      <h1 className="text-2xl font-bold">Previous Meetings</h1>
      {meetings.length === 0 ? (
        <p className="text-sky-1">No previous meetings found.</p>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <article
              key={meeting.id}
              className="rounded-lg bg-dark-3 p-4 flex items-center justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{meeting.title}</h2>
                <p className="text-sky-1 text-sm">
                  Host: {meeting.hostName} | Participants: {meeting.participantCount}
                </p>
                <p className="text-sky-1 text-sm">
                  Scheduled: {new Date(meeting.scheduledAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded bg-dark-4 px-2 py-1 text-xs">
                  {meeting.status}
                </span>
                <Button
                  className="bg-blue-1"
                  onClick={() => router.push(`/meeting/${meeting.streamCallId}`)}
                >
                  Join Meeting
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Previous;
