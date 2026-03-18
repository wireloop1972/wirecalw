"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { usePoeChat, type Message } from "@/hooks/usePoeChat";

const PoeAvatar = () => (
  <div className="mr-3 h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-wl-orange/60">
    <Image
      src="/images/poe.png"
      alt="Poe"
      width={36}
      height={36}
      className="h-full w-full object-cover"
    />
  </div>
);

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && <PoeAvatar />}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-wl-orange text-wl-black"
            : "bg-wl-surface text-wl-text"
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <p className="mt-20 text-center text-sm text-wl-muted">
            Begin your conversation with Poe.
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <PoeAvatar />
            <div className="rounded-2xl bg-wl-surface px-4 py-3 text-sm text-wl-muted">
              Poe is composing a reply&hellip;
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="mx-4 mb-2 rounded-lg border border-red-500/20
            bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-wl-border px-4 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          disabled={isLoading}
          className="flex-1 rounded-xl border border-wl-border bg-wl-surface px-4
            py-2.5 text-sm text-wl-text outline-none placeholder:text-wl-muted
            focus:border-wl-orange/50 focus:ring-1 focus:ring-wl-orange/50
            disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-wl-orange px-5 py-2.5 text-sm font-medium
            text-wl-black transition-colors hover:bg-wl-orange-light
            disabled:opacity-40 disabled:hover:bg-wl-orange"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default PoeChat;
