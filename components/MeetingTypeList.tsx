"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import HomeCard from "./HomeCard";
import MeetingModal from "./MeetingModal";
import { useUser } from "@clerk/nextjs";
import Loader from "./Loader";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { useApiClient } from "@/lib/api-client";
// import { Input } from './ui/input';

const initialValues = {
  dateTime: new Date(),
  description: "",
  link: "",
};

const toLocalDateTimeInputValue = (date: Date) => {
  const offsetInMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetInMs).toISOString().slice(0, 16);
};

const getJoinPathFromInput = (rawLink: string) => {
  const trimmed = rawLink.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);
    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return `/meeting/${trimmed}`;
  }
};

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    "isScheduleMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >(undefined);
  const [values, setValues] = useState(initialValues);
  const [callDetail, setCallDetail] = useState<{ streamCallId: string }>();
  const { user } = useUser();
  const { toast } = useToast();
  const { createMeeting: createMeetingRequest } = useApiClient();

  const handleJoinByLink = () => {
    const joinPath = getJoinPathFromInput(values.link);

    if (!joinPath) {
      toast({ title: "Please paste a meeting link" });
      return;
    }

    router.push(joinPath);
  };

  const handleCreateMeeting = async () => {
    if (!user) return;

    try {
      if (!values.dateTime) {
        toast({ title: "Please select a date and time" });
        return;
      }

      const response = await createMeetingRequest({
        title: values.description || "Instant Meeting",
        description: values.description || "Instant Meeting",
        scheduledAt: values.dateTime.toISOString(),
      });

      setCallDetail({ streamCallId: response.streamCallId });

      if (meetingState === "isInstantMeeting") {
        router.push(response.joinUrl);
      }

      toast({
        title: "Meeting Created",
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to create Meeting" });
    }
  };

  if (!user) return <Loader />;

  const appBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const meetingLink = callDetail
    ? `${appBaseUrl}/meeting/${callDetail.streamCallId}`
    : "";

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => setMeetingState("isInstantMeeting")}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="via invitation link"
        className="bg-blue-1"
        handleClick={() => setMeetingState("isJoiningMeeting")}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        className="bg-purple-1"
        handleClick={() => setMeetingState("isScheduleMeeting")}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Meeting Recordings"
        className="bg-yellow-1"
        handleClick={() => router.push("/recordings")}
      />

      {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={handleCreateMeeting}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Add a description
            </label>
            <Textarea
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Select Date and Time
            </label>
            <input
              type="datetime-local"
              value={toLocalDateTimeInputValue(values.dateTime)}
              min={toLocalDateTimeInputValue(new Date())}
              onChange={(e) => {
                const nextDate = new Date(e.target.value);
                if (Number.isNaN(nextDate.getTime())) return;
                setValues({ ...values, dateTime: nextDate });
              }}
              className="w-full rounded bg-dark-3 p-2 text-white focus:outline-none"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: "Link Copied" });
          }}
          image={"/icons/checked.svg"}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
        />
      )}

      <MeetingModal
        isOpen={meetingState === "isJoiningMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={handleJoinByLink}
      >
        <input
          type="text"
          placeholder="Paste meeting link or meeting ID"
          value={values.link}
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="w-full rounded-md border-none bg-dark-3 px-3 py-2 text-white focus:outline-none"
        />
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === "isInstantMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={handleCreateMeeting}
      />
    </section>
  );
};

export default MeetingTypeList;
