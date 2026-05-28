// app/login/page.tsx  ← Server Component (no "use client")
import { redirectIfAuthenticated } from "@/lib/auth/helpers";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  await redirectIfAuthenticated();
  return <LoginForm />;
}
