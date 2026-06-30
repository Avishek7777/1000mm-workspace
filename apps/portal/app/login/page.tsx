import { Suspense } from "react";
import { redirectIfAuthenticated } from "@/lib/auth/helpers";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  await redirectIfAuthenticated();
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
