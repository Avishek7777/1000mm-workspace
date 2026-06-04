// app/login/page.tsx  ← Server Component (no "use client")
import { Suspense } from "react";
import { redirectIfAuthenticated } from "@/lib/auth/helpers";
import LoginForm from "./login/LoginForm";

export default async function LoginPage() {
  await redirectIfAuthenticated();
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
