import Link from "next/link";

const ClaudePage = () => {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center
        bg-white px-6 dark:bg-zinc-950"
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full
          bg-indigo-100 text-2xl font-bold text-indigo-700
          dark:bg-indigo-900 dark:text-indigo-200"
      >
        C
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Claude
      </h1>
      <p className="mt-2 text-zinc-500">Coming soon</p>
      <p className="mt-1 max-w-xs text-center text-sm text-zinc-400">
        A thoughtful conversationalist who balances rigorous analysis with
        creative flair. Claude is being prepared for service.
      </p>
      <Link
        href="/"
        className="mt-8 text-sm text-zinc-500 transition-colors hover:text-zinc-900
          dark:hover:text-zinc-200"
      >
        &larr; Back to assistants
      </Link>
    </div>
  );
};

export default ClaudePage;
