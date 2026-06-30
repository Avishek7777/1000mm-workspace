import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface Props {
  name: string;
  url: string;
}

export default function PasswordReset({ name, url }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your 1000MM portal password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerTitle}>1000 Missionary Movement Bangladesh</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Password reset request</Heading>
            <Text style={para}>Hi {name},</Text>
            <Text style={para}>
              We received a request to reset the password for your 1000MM
              portal account. Click the button below to choose a new password.
            </Text>

            <Section style={btnWrap}>
              <Button style={btn} href={url}>
                Reset Password
              </Button>
            </Section>

            <Text style={small}>
              This link expires in <strong>1 hour</strong>. If you did not
              request a password reset, you can safely ignore this email — your
              password will not change.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              If the button above doesn&apos;t work, copy and paste this link
              into your browser:
            </Text>
            <Text style={linkText}>{url}</Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              © {new Date().getFullYear()} 1000 Missionary Movement Bangladesh
              · A Ministry of the Seventh-day Adventist Church
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f9f9",
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "32px auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #e2eef0",
};

const header: React.CSSProperties = {
  background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
  padding: "24px 32px",
};

const headerTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0",
  letterSpacing: "0.02em",
};

const content: React.CSSProperties = {
  padding: "32px",
};

const h1: React.CSSProperties = {
  color: "#0b3d49",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 20px",
};

const para: React.CSSProperties = {
  color: "#4a6670",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const btnWrap: React.CSSProperties = {
  textAlign: "center",
  margin: "28px 0",
};

const btn: React.CSSProperties = {
  background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  padding: "14px 32px",
  borderRadius: "9999px",
  textDecoration: "none",
  display: "inline-block",
};

const small: React.CSSProperties = {
  color: "#7a9ba5",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const hr: React.CSSProperties = {
  borderColor: "#e2eef0",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#7a9ba5",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 6px",
};

const linkText: React.CSSProperties = {
  color: "#007f98",
  fontSize: "11px",
  wordBreak: "break-all",
  margin: "0",
};

const footerSection: React.CSSProperties = {
  backgroundColor: "#f4f9f9",
  padding: "16px 32px",
  borderTop: "1px solid #e2eef0",
};

const footerText: React.CSSProperties = {
  color: "#aabfc5",
  fontSize: "11px",
  textAlign: "center",
  margin: "0",
};
