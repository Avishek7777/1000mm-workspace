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

export default function TrainerSetup({ name, url }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your 1000MM Trainer account has been approved — set your password to get started</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerTitle}>1000 Missionary Movement Bangladesh</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Your trainer account is approved!</Heading>
            <Text style={para}>Dear {name},</Text>
            <Text style={para}>
              We are delighted to inform you that your application to serve as a
              trainer with the 1000 Missionary Movement Bangladesh has been
              approved. Welcome to the team!
            </Text>
            <Text style={para}>
              Click the button below to set your password and access your
              trainer dashboard. From there, you will be able to manage your
              assigned trainees, submit reports, and coordinate your missionary
              work.
            </Text>

            <Section style={btnWrap}>
              <Button style={btn} href={url}>
                Set Up My Account
              </Button>
            </Section>

            <Text style={small}>
              This link expires in <strong>7 days</strong>. If you have any
              trouble, please reply to this email or contact your mission
              office.
            </Text>

            <Hr style={hr} />

            <Text style={scripture}>
              &ldquo;Here am I, Lord, send me.&rdquo; — Isaiah 6:8
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
  background: "linear-gradient(90deg, #16a34a 0%, #007f98 100%)",
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

const scripture: React.CSSProperties = {
  color: "#007f98",
  fontSize: "14px",
  fontStyle: "italic",
  textAlign: "center",
  margin: "0",
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
