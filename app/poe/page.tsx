import Image from "next/image";
import Link from "next/link";
import PoeChat from "@/components/chat/PoeChat";

const PoePage = () => (
  <div className="gjest-page flex h-dvh flex-col">
    <header className="gjest-header shrink-0 border-b border-[var(--gjest-border)]">
      <Link href="/" className="block">
        <div className="relative w-full overflow-hidden bg-[#0a0b0b]">
          <Image
            src="/images/gjestgiveri-header.png"
            alt="Nevlunghavn Gjestgiveri"
            width={1200}
            height={400}
            priority
            className="h-auto w-full object-contain"
            sizes="100vw"
          />
        </div>
      </Link>
    </header>
    <PoeChat />
  </div>
);

export default PoePage;
