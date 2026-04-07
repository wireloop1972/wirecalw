import { AssistantHomeLink } from "@/components/AssistantHomeLink";

const ClaudePage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-wl-black px-6">
    <div
      className="flex h-16 w-16 items-center justify-center rounded-full
        border-2 border-indigo-500 bg-indigo-500/10 text-2xl font-bold
        text-indigo-400"
    >
      C
    </div>
    <h1 className="mt-6 text-2xl font-semibold text-wl-text">Claude</h1>
    <p className="mt-2 text-wl-orange">Coming soon</p>
    <p className="mt-1 max-w-xs text-center text-sm text-wl-muted">
      A thoughtful conversationalist who balances rigorous analysis with
      creative flair. Claude is being prepared for service.
    </p>
    <AssistantHomeLink
      className="mt-8 text-sm text-wl-muted transition-colors hover:text-wl-orange"
    >
      &larr; Back to assistants
    </AssistantHomeLink>
  </div>
);

export default ClaudePage;
