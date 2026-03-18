import Image from "next/image";
import Link from "next/link";
import PoeChat from "@/components/chat/PoeChat";

const PoePage = () => (
  <div className="flex h-screen flex-col bg-wl-black">
    <header
      className="flex items-center justify-between border-b
        border-wl-border px-6 py-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-wl-orange/60">
          <Image
            src="/images/poe.png"
            alt="Poe"
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-wl-text">Poe</h1>
          <p className="text-xs text-wl-muted">
            Your Victorian gentleman&apos;s gentleman
          </p>
        </div>
      </div>
      <Link
        href="/"
        className="text-sm text-wl-muted transition-colors hover:text-wl-orange"
      >
        &larr; Back
      </Link>
    </header>
    <PoeChat />
  </div>
);

export default PoePage;
