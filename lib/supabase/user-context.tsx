"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "member";
  title: string | null;
  phoneNumber: string | null;
}

const UserContext = createContext<UserProfile | null>(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export const UserProvider = ({
  profile,
  children,
}: {
  profile: UserProfile;
  children: ReactNode;
}) => <UserContext value={profile}>{children}</UserContext>;
