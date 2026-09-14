import nodemailer, { type Transporter } from "nodemailer";
import { fillTemplate } from "@/lib/template";

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

const ROLE_LABELS: Record<"teacher" | "student" | "admin", string> = {
  teacher: "მასწავლებლის",
  student: "მოსწავლის",
  admin: "ადმინისტრატორის",
};

export async function sendMagicLinkEmail({
  to,
  role,
  url,
  subjectTemplate,
  bodyTemplate,
}: {
  to: string;
  role: "teacher" | "student" | "admin";
  url: string;
  // Admin-edited templates from Settings. Callers always pass these
  // (via getSettings()) so the copy stays admin-controlled; the
  // literal defaults here only cover the case where Settings hasn't
  // been created yet and only run through getSettings's own
  // @default() values in practice.
  subjectTemplate: string;
  bodyTemplate: string;
}) {
  const t = getTransporter();

  const roleLabel = ROLE_LABELS[role];
  const subject = fillTemplate(subjectTemplate, { roleLabel, url });
  const text = fillTemplate(bodyTemplate, { roleLabel, url });
  const html = text
    .split("\n\n")
    .map((para) =>
      para.includes(url)
        ? `<p><a href="${url}">${url}</a></p>`
        : `<p>${para.replace(/\n/g, "<br/>")}</p>`
    )
    .join("\n");

  if (!t) {
    // SMTP not configured for this environment — same dev fallback
    // the flow always had, just centralized here.
    console.log(`[magic-link] SMTP not configured, link for ${to}: ${url}`);
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;

  await t.sendMail({ from, to, subject, text, html });
}
