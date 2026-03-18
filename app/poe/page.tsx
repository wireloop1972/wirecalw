import Link from "next/link";
import PoeChat from "@/components/chat/PoeChat";

const PoePage = () => {
  return (
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-950">
      <header
        className="flex items-center justify-between border-b
          border-zinc-200 px-6 py-4 dark:border-zinc-800"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full
              bg-amber-800 text-sm font-semibold text-amber-50"
          >
            P
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Poe
            </h1>
            <p className="text-xs text-zinc-500">
              Your Victorian gentleman&apos;s gentleman
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900
            dark:hover:text-zinc-200"
        >
          &larr; Back
        </Link>
      </header>
      <PoeChat />
    </div>
  );
};

export default PoePage;
