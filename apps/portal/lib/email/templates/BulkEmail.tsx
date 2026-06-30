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
  subject: string;
  body: string;
  senderName: string;
}

export default function BulkEmail({ subject, body, senderName }: Props) {
  const paragraphs = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <Html lang="en">
      <Head />
      <Preview>{subject}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.headerTitle}>1000 Missionary Movement Bangladesh</Text>
          </Section>

          <Section style={styles.content}>
            <Heading style={styles.h1}>{subject}</Heading>

            {paragraphs.map((para, i) => (
              <Text key={i} style={styles.para}>
                {para}
              </Text>
            ))}

            <Hr style={styles.hr} />

            <Text style={styles.sig}>
              {senderName}
              {"\n"}1000 Missionary Movement Bangladesh
            </Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} 1000 Missionary Movement Bangladesh ·
              A Ministry of the Seventh-day Adventist Church
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#f4f9f9",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  container: {
    maxWidth: "560px",
    margin: "32px auto",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e2eef0",
  },
  header: {
    background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
    padding: "24px 32px",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    margin: "0",
    letterSpacing: "0.02em",
  },
  content: {
    padding: "32px",
  },
  h1: {
    color: "#0b3d49",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 20px",
  },
  para: {
    color: "#4a6670",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: "0 0 16px",
    whiteSpace: "pre-wrap",
  },
  hr: {
    borderColor: "#e2eef0",
    margin: "24px 0",
  },
  sig: {
    color: "#4a6670",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
    whiteSpace: "pre-wrap",
  },
  footer: {
    backgroundColor: "#f4f9f9",
    padding: "16px 32px",
    borderTop: "1px solid #e2eef0",
  },
  footerText: {
    color: "#aabfc5",
    fontSize: "11px",
    textAlign: "center",
    margin: "0",
  },
};
