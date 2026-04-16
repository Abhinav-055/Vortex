"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useApiClient, type RecordingListItem } from "@/lib/api-client";

const Recordings = () => {
  const { getRecordings, getRecordingUrl } = useApiClient();
  const [recordings, setRecordings] = useState<RecordingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningId, setIsOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecordings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getRecordings();
        setRecordings(response.recordings);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecordings();
  }, [getRecordings]);

  const handlePlay = async (recordingId: string) => {
    try {
      setIsOpeningId(recordingId);
      const response = await getRecordingUrl(recordingId);
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to open";
      setError(message);
    } finally {
      setIsOpeningId(null);
    }
  };

  if (isLoading) {
    return <div className="text-white">Loading recordings...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  return (
    <section className="flex flex-col gap-4 text-white">
      <h1 className="text-2xl font-bold">Recordings</h1>
      {recordings.length === 0 ? (
        <p className="text-sky-1">No recordings found.</p>
      ) : (
        <div className="grid gap-4">
          {recordings.map((recording) => (
            <article
              key={recording.id}
              className="rounded-lg bg-dark-3 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{recording.meetingTitle}</h2>
                <p className="text-sky-1 text-sm">
                  Recorded: {new Date(recording.recordedAt).toLocaleString()}
                </p>
                <p className="text-sky-1 text-sm">
                  Duration: {recording.durationSecs ?? 0} seconds
                </p>
              </div>
              <Button
                className="bg-blue-1"
                onClick={() => handlePlay(recording.id)}
                disabled={isOpeningId === recording.id}
              >
                {isOpeningId === recording.id ? "Opening..." : "Play"}
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Recordings;
