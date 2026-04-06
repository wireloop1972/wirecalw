import Image from "next/image";
import Link from "next/link";

const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="gjest-auth-page">
    <Link href="/" className="mb-6 block">
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
    <div className="gjest-auth-card">{children}</div>
    <p className="mt-6 text-center text-[0.6875rem] text-[var(--gjest-ink-muted)]">
      Powered by OpenClaw &middot; Wire Loop Labs
    </p>
  </div>
);

export default AuthLayout;
