import "server-only";
import { Resend } from "resend";
import VerifyEmail from "./templates/VerifyEmail";
import PasswordReset from "./templates/PasswordReset";
import TrainerSetup from "./templates/TrainerSetup";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@1000mm.org.bd";
const APP_URL = process.env.AUTH_URL ?? "http://localhost:3001";

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Verify your email — 1000MM Bangladesh",
      react: <VerifyEmail name={name} url={url} />,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send verification email to", to, err);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  url: string,
) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your password — 1000MM Bangladesh",
      react: <PasswordReset name={name} url={url} />,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send password reset email to", to, err);
  }
}

export async function sendTrainerSetupEmail(
  to: string,
  name: string,
  url: string,
) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Set up your 1000MM Trainer account",
      react: <TrainerSetup name={name} url={url} />,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send trainer setup email to", to, err);
  }
}
