import "server-only";
import { Resend } from "resend";
import VerifyEmail from "./templates/VerifyEmail";
import PasswordReset from "./templates/PasswordReset";
import TrainerSetup from "./templates/TrainerSetup";
import ContactReply from "./templates/ContactReply";
import ApplicationEvent from "./templates/ApplicationEvent";

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@1000mm.org.bd";
// Contact-form replies always come from the public info address so
// recipients can reply directly to it.
const CONTACT_REPLY_FROM = "info@1000mm.org.bd";
const APP_URL = process.env.AUTH_URL ?? "http://localhost:3001";

// Lazy so that merely importing this module (e.g. via an actions barrel)
// doesn't crash when RESEND_API_KEY is absent in the environment.
let resendClient: Resend | null = null;
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set — email sending is disabled.");
  }
  resendClient ??= new Resend(key);
  return resendClient;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  try {
    await getResend().emails.send({
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
    await getResend().emails.send({
      from: FROM,
      to,
      subject: "Reset your password — 1000MM Bangladesh",
      react: <PasswordReset name={name} url={url} />,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send password reset email to", to, err);
  }
}

/**
 * Reply to a website contact-form message.
 * Unlike the fire-and-forget senders above, this THROWS on failure so the
 * caller can tell the admin the reply was not delivered.
 */
export async function sendContactReplyEmail(
  to: string,
  name: string,
  subject: string,
  originalMessage: string,
  reply: string,
) {
  const { error } = await getResend().emails.send({
    from: `1000MM Bangladesh <${CONTACT_REPLY_FROM}>`,
    to,
    subject,
    react: (
      <ContactReply
        name={name}
        originalMessage={originalMessage}
        reply={reply}
      />
    ),
  });
  if (error) {
    throw new Error(`Resend rejected the email: ${error.message}`);
  }
}

/**
 * Shared sender for the application-pipeline emails (new submission → LMD,
 * recommendation → Union Director, rejection → applicant). Fire-and-forget
 * like the other non-critical senders — a failed email should never break
 * the underlying application-status change.
 */
export async function sendApplicationEventEmail(params: {
  to: string;
  recipientName: string;
  subject: string;
  heading: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
}) {
  try {
    await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      react: (
        <ApplicationEvent
          recipientName={params.recipientName}
          heading={params.heading}
          message={params.message}
          actionUrl={params.actionUrl}
          actionLabel={params.actionLabel}
        />
      ),
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send application event email to", params.to, err);
  }
}

export async function sendTrainerSetupEmail(
  to: string,
  name: string,
  url: string,
) {
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: "Set up your 1000MM Trainer account",
      react: <TrainerSetup name={name} url={url} />,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send trainer setup email to", to, err);
  }
}
