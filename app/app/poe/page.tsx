import Image from "next/image";
import Link from "next/link";
import PoeChat from "@/components/chat/PoeChat";
import ProfileMenu from "@/components/ProfileMenu";

const PoePage = () => (
  <div className="gjest-page flex h-dvh flex-col">
    <header className="shrink-0 border-b border-[var(--gjest-border)] bg-white">
      <div className="flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2">
        <Link href="/app" className="block">
          <div className="w-[180px] sm:w-[220px]">
            <Image
              src="/images/gjestgiveri-header.png"
              alt="Nevlunghavn Gjestgiveri"
              width={1200}
              height={400}
              priority
              className="h-auto w-full object-contain"
              sizes="220px"
            />
          </div>
        </Link>
        <ProfileMenu />
      </div>
    </header>
    <PoeChat />
  </div>
);

export default PoePage;
