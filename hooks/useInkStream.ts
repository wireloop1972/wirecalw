"use client";

import { useEffect, useRef, useState } from "react";

export interface UseInkStreamOptions {
  text: string;
  onComplete?: () => void;
  baseMsPerChar?: number;
}

const getCharDelay = (char: string, base: number): number => {
  if (char === "\n") return base * 0.3;
  if (char === " ") return base * 0.35;
  if (".,;:".includes(char)) return base * 2.2;
  if ("!?".includes(char)) return base * 2.8;
  if (char === "\u2014" || char === "\u2013") return base * 2.4;
  return base;
};

export const useInkStream = ({
  text,
  onComplete,
  baseMsPerChar = 22,
}: UseInkStreamOptions) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || text.length === 0) {
      setVisibleCount(text.length);
      setFinished(true);
      onCompleteRef.current?.();
      return;
    }

    setVisibleCount(0);
    setFinished(false);
    let i = 0;

    const clearT = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const step = () => {
      if (i >= text.length) {
        setFinished(true);
        onCompleteRef.current?.();
        return;
      }
      i += 1;
      setVisibleCount(i);
      const char = text[i - 1] ?? "";
      const delay = getCharDelay(char, baseMsPerChar);
      timeoutRef.current = setTimeout(step, delay);
    };

    timeoutRef.current = setTimeout(step, 320);

    return () => {
      clearT();
    };
  }, [text, baseMsPerChar]);

  const visibleSlice = text.slice(0, visibleCount);
  const isStreaming = !finished && visibleCount < text.length;

  return { visibleSlice, visibleCount, isStreaming, finished };
};
