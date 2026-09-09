import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null | undefined; // undefined = not checked yet

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    // Not configured — caller falls back to logging the link instead
    // of throwing, so local dev keeps working without an SMTP account.
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // 465 = implicit TLS, 587/25 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  return transporter;
}

export async function sendMagicLinkEmail({
  to,
  role,
  url,
}: {
  to: string;
  role: "teacher" | "student";
  url: string;
}) {
  const t = getTransporter();

  if (!t) {
    // SMTP not configured for this environment — same dev fallback
    // the flow always had, just centralized here.
    console.log(`[magic-link] SMTP not configured, link for ${to}: ${url}`);
    return;
  }

  const roleLabel = role === "teacher" ? "მასწავლებლის" : "მოსწავლის";
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;

  await t.sendMail({
    from,
    to,
    subject: "შესვლის ბმული",
    text: `თქვენი ${roleLabel} ანგარიშზე შესასვლელად გადადით ბმულზე (მოქმედია 15 წუთი):\n\n${url}\n\nთუ ეს მოთხოვნა თქვენ არ გაგზავნიათ, უბრალოდ იგნორირება გაუკეთეთ ამ წერილს.`,
    html: `
      <p>თქვენი ${roleLabel} ანგარიშზე შესასვლელად დააჭირეთ ქვემოთ მოცემულ ბმულს (მოქმედია 15 წუთი):</p>
      <p><a href="${url}">${url}</a></p>
      <p style="color:#888;font-size:13px">თუ ეს მოთხოვნა თქვენ არ გაგზავნიათ, უბრალოდ იგნორირება გაუკეთეთ ამ წერილს.</p>
    `,
  });
}
