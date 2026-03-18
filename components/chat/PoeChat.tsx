"use client";

import { useRef, useEffect, useState } from "react";
import { usePoeChat, type Message } from "@/hooks/usePoeChat";

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div
          className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center
            rounded-full bg-amber-800 text-sm font-semibold text-amber-50"
        >
          P
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-800 text-zinc-50"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
};

const PoeChat = () => {
  const { messages, sendMessage, isLoading, error } = usePoeChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        {messages.length === 0 && (
          <p className="mt-20 text-center text-sm text-zinc-400">
            Begin your conversation with Poe.
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div
              className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center
                rounded-full bg-amber-800 text-sm font-semibold text-amber-50"
            >
              P
            </div>
            <div
              className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500
                dark:bg-zinc-800 dark:text-zinc-400"
            >
              Poe is composing a reply&hellip;
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700
          dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-zinc-200 px-4 py-3
          dark:border-zinc-700"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          disabled={isLoading}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5
            text-sm text-zinc-900 outline-none placeholder:text-zinc-400
            focus:border-amber-700 focus:ring-1 focus:ring-amber-700
            disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900
            dark:text-zinc-100 dark:placeholder:text-zinc-500
            dark:focus:border-amber-600 dark:focus:ring-amber-600"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-amber-800 px-5 py-2.5 text-sm font-medium
            text-amber-50 transition-colors hover:bg-amber-700
            disabled:opacity-50 disabled:hover:bg-amber-800"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default PoeChat;
