"use client";

import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

const LoginPage = () => (
  <Suspense>
    <LoginForm />
  </Suspense>
);

export default LoginPage;
