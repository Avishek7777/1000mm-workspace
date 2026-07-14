import {
  Body,
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
  originalMessage: string;
  reply: string;
}

export default function ContactReply({ name, originalMessage, reply }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reply to your message to 1000MM Bangladesh</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerTitle}>1000 Missionary Movement Bangladesh</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Reply to your message</Heading>
            <Text style={para}>Dear {name},</Text>
            <Text style={para}>
              Thank you for contacting the 1000 Missionary Movement Bangladesh.
              Here is our reply to your message:
            </Text>

            <Section style={replyBox}>
              <Text style={replyText}>{reply}</Text>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>Your original message:</Text>
            <Text style={quotedText}>{originalMessage}</Text>

            <Text style={small}>
              If you have further questions, simply reply to this email.
            </Text>
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

const replyBox: React.CSSProperties = {
  backgroundColor: "#f4f9f9",
  borderLeft: "3px solid #007f98",
  borderRadius: "0 8px 8px 0",
  padding: "16px 20px",
  margin: "20px 0",
};

const replyText: React.CSSProperties = {
  color: "#0b3d49",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0",
  whiteSpace: "pre-wrap",
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

const quotedText: React.CSSProperties = {
  color: "#7a9ba5",
  fontSize: "13px",
  lineHeight: "1.6",
  fontStyle: "italic",
  margin: "0 0 20px",
  whiteSpace: "pre-wrap",
};

const small: React.CSSProperties = {
  color: "#7a9ba5",
  fontSize: "13px",
  lineHeight: "1.6",
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
