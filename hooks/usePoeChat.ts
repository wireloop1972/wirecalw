"use client";

import { useState, useCallback, useRef } from "react";

export type EntryRole = "portier" | "guest";

export interface ChatEntry {
  id: string;
  role: EntryRole;
  text: string;
}

export const usePoeChat = () => {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamSettled, setStreamSettled] = useState<Record<string, boolean>>(
    {},
  );
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const onStreamDone = useCallback((id: string) => {
    setStreamSettled((s) => ({ ...s, [id]: true }));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const guestId = `g-${Date.now()}`;
      const guestEntry: ChatEntry = {
        id: guestId,
        role: "guest",
        text: trimmed,
      };

      const currentEntries = entriesRef.current;
      const allMessages = [
        ...currentEntries.map((e) => ({
          role:
            e.role === "guest" ? ("user" as const) : ("assistant" as const),
          content: e.text,
        })),
        { role: "user" as const, content: trimmed },
      ];

      setEntries((prev) => [...prev, guestEntry]);
      setStreamSettled((s) => ({ ...s, [guestId]: true }));
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/poe/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allMessages }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Noe gikk galt.");
          setIsLoading(false);
          return;
        }

        const portierId = `p-${Date.now()}`;
        setEntries((prev) => [
          ...prev,
          { id: portierId, role: "portier", text: data.assistantMessage },
        ]);
        setIsLoading(false);
      } catch {
        setError("Kunne ikke naa tjeneren. Vennligst forsoek igjen.");
        setIsLoading(false);
      }
    },
    [],
  );

  const clearChat = useCallback(() => {
    setEntries([]);
    setStreamSettled({});
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    entries,
    streamSettled,
    onStreamDone,
    sendMessage,
    isLoading,
    error,
    clearChat,
  };
};
