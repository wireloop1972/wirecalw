"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useUser } from "@/lib/supabase/user-context";
import { homePathForUser } from "@/lib/post-login-redirect";

interface AssistantHomeLinkProps {
  children: ReactNode;
  className?: string;
}

/** Admin → /app (three agents); everyone else → /app/poe. */
export const AssistantHomeLink = ({
  children,
  className,
}: AssistantHomeLinkProps) => {
  const user = useUser();
  const href = homePathForUser(user.role);
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
};
