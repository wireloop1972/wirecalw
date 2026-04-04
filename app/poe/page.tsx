import Image from "next/image";
import Link from "next/link";
import PoeChat from "@/components/chat/PoeChat";

const PoePage = () => (
  <div className="gjest-page flex h-dvh flex-col">
    <header className="shrink-0 border-b border-[var(--gjest-border)] bg-white">
      <Link href="/" className="block">
        <div className="mx-auto w-full max-w-[240px] px-4 py-2 sm:max-w-[280px]">
          <Image
            src="/images/gjestgiveri-header.png"
            alt="Nevlunghavn Gjestgiveri"
            width={1200}
            height={400}
            priority
            className="h-auto w-full object-contain"
            sizes="(max-width: 448px) 100vw, 448px"
          />
        </div>
      </Link>
    </header>
    <PoeChat />
  </div>
);

export default PoePage;
