"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { PortierMessageMarkdown } from "@/components/chat/PortierMessageMarkdown";
import { useInkStream } from "@/hooks/useInkStream";
import { usePoeChat, type ChatEntry } from "@/hooks/usePoeChat";
import { useUser } from "@/lib/supabase/user-context";
import { formatDisplayName } from "@/lib/user-profile";

const DropCap = ({ letter }: { letter: string }) => (
  <span className="gjest-drop-cap float-left font-display" aria-hidden>
    {letter}
  </span>
);

const InkCursor = () => (
  <span className="gjest-ink-cursor" aria-hidden>
    <span className="gjest-ink-cursor__nib" />
  </span>
);

const PortierStreamPresentation = ({
  visibleSlice,
  visibleCount,
  isStreaming,
  scrollParentRef,
}: {
  visibleSlice: string;
  visibleCount: number;
  isStreaming: boolean;
  scrollParentRef: RefObject<HTMLDivElement | null>;
}) => {
  useEffect(() => {
    if (!isStreaming || !scrollParentRef.current) return;
    const el = scrollParentRef.current;
    el.scrollTop = el.scrollHeight;
  }, [visibleCount, isStreaming, scrollParentRef]);

  const first = visibleSlice.charAt(0);
  const afterFirst = visibleSlice.slice(1);

  return (
    <div
      className={`gjest-lane-narrator ${isStreaming ? "gjest-lane-narrator--streaming" : ""}`}
      aria-busy={isStreaming}
    >
      <div className="gjest-narrator-label-row">
        <span className="gjest-lane-label">Portier Poe</span>
        {isStreaming && <span className="gjest-quill-pulse" aria-hidden />}
      </div>
      <div
        className="gjest-narrator-body text-pretty whitespace-pre-line"
        aria-live="polite"
      >
        {visibleCount > 0 ? (
          <>
            <DropCap letter={first} />
            <PortierMessageMarkdown source={afterFirst} />
            {isStreaming && <InkCursor />}
          </>
        ) : (
          <>
            <span className="gjest-narrator-waiting">
              Pennen nøler ...
            </span>
            <InkCursor />
          </>
        )}
      </div>
    </div>
  );
};

const PortierStreamingInk = ({
  text,
  onComplete,
  scrollParentRef,
}: {
  text: string;
  onComplete: () => void;
  scrollParentRef: RefObject<HTMLDivElement | null>;
}) => {
  const { visibleSlice, visibleCount, isStreaming } = useInkStream({
    text,
    onComplete,
    baseMsPerChar: 20,
  });

  return (
    <PortierStreamPresentation
      visibleSlice={visibleSlice}
      visibleCount={visibleCount}
      isStreaming={isStreaming}
      scrollParentRef={scrollParentRef}
    />
  );
};

const PortierStatic = ({ text }: { text: string }) => {
  const first = text.charAt(0);
  const rest = text.slice(1);
  return (
    <div className="gjest-lane-narrator">
      <div className="gjest-narrator-label-row">
        <span className="gjest-lane-label">Portier Poe</span>
      </div>
      <div className="gjest-narrator-body text-pretty whitespace-pre-line">
        {text.length > 0 ? (
          <>
            <DropCap letter={first} />
            <PortierMessageMarkdown source={rest} />
          </>
        ) : null}
      </div>
    </div>
  );
};

const PortierQueued = () => (
  <div
    className="gjest-lane-narrator gjest-narrator-queued"
    aria-hidden
  >
    <span className="gjest-queued-line" />
    <span className="gjest-queued-line" />
    <span className="gjest-queued-line gjest-queued-line--short" />
  </div>
);

const GuestInscription = ({
  text,
  displayName,
}: {
  text: string;
  displayName: string;
}) => (
  <div className="gjest-guest-lane">
    <span className="gjest-lane-label">{displayName}</span>
    <p className="gjest-guest-body mt-1 text-pretty">{text}</p>
  </div>
);

const EntryBlock = ({
  entry,
  streamSettled,
  nextStreamEntryId,
  onStreamDone,
  scrollRef,
  guestName,
}: {
  entry: ChatEntry;
  streamSettled: Record<string, boolean>;
  nextStreamEntryId: string | null;
  onStreamDone: (id: string) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  guestName: string;
}) => {
  if (entry.role === "portier") {
    if (streamSettled[entry.id]) {
      return <PortierStatic text={entry.text} />;
    }
    if (entry.id === nextStreamEntryId) {
      return (
        <PortierStreamingInk
          text={entry.text}
          onComplete={() => onStreamDone(entry.id)}
          scrollParentRef={scrollRef}
        />
      );
    }
    return <PortierQueued />;
  }

  return <GuestInscription text={entry.text} displayName={guestName} />;
};

const PoeChat = () => {
  const user = useUser();
  const guestName = formatDisplayName({
    firstName: user.firstName,
    lastName: user.lastName,
    title: user.title,
    email: user.email,
  });
  const {
    entries,
    streamSettled,
    onStreamDone,
    sendMessage,
    isLoading,
    error,
  } = usePoeChat();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const nextStreamEntryId = useMemo(() => {
    for (const e of entries) {
      if (e.role === "portier" && !streamSettled[e.id]) {
        return e.id;
      }
    }
    return null;
  }, [entries, streamSettled]);

  const isAnyStreaming = nextStreamEntryId !== null;

  const commitGuestLine = useCallback(async () => {
    const t = draft.trim();
    if (!t || isLoading || isAnyStreaming) return;
    setDraft("");
    await sendMessage(t);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [draft, isLoading, isAnyStreaming, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commitGuestLine();
  };

  const busy = isLoading || isAnyStreaming;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="gjest-leather-shell mx-2 mt-2 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden sm:mx-4">
        <div
          ref={scrollRef}
          className="gjest-page-surface min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
        >
          {entries.length === 0 && !isLoading && (
            <p className="mt-8 text-center font-display text-sm italic text-[var(--gjest-ink-muted)]">
              Portiéren venter ved skrivebordet.
            </p>
          )}

          {isLoading && entries.length === 0 && <PortierQueued />}

          <div className="flex flex-col gap-5">
            {entries.map((e) => (
              <EntryBlock
                key={e.id}
                entry={e}
                streamSettled={streamSettled}
                nextStreamEntryId={nextStreamEntryId}
                onStreamDone={onStreamDone}
                scrollRef={scrollRef}
                guestName={guestName}
              />
            ))}
            {isLoading && entries.length > 0 && <PortierQueued />}
          </div>
        </div>

        {error && (
          <div className="mx-4 mb-2 rounded border border-[rgba(107,48,48,0.3)] bg-[rgba(107,48,48,0.08)] px-3 py-2 text-sm text-[#6b3030]">
            {error}
          </div>
        )}

        <div className="gjest-inscription-band shrink-0 p-3 sm:p-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Skriv til portiéren ..."
              disabled={busy}
              className="gjest-inscription-input min-w-0 flex-1 disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="gjest-seal-btn shrink-0 rounded-sm px-4 py-2 text-sm font-semibold tracking-wide"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PoeChat;
