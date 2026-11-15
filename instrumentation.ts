import type { Instrumentation } from "next";

// სერვერის ყოველ შეცდომაზე ("This page couldn't load" და სხვ.) მეილს
// აგზავნის შეცდომის სრული ტექსტით — Vercel-ის ლოგებზე რომ არ ვიყოთ
// დამოკიდებული (უფასო გეგმაზე მალე იშლება). იყენებს იმავე SMTP-ს,
// რასაც შესვლის მეილები. ეკრანზე ნაჩვენები "ERROR ..." ნომერი = digest.
// მიმღების მისამართი: Vercel-ის env ცვლადი ERROR_REPORT_EMAIL
// (თუ არ არის მითითებული, მეილი არ იგზავნება).

// ერთსა და იმავე შეცდომაზე მეილების ნაკადი რომ არ წამოვიდეს:
// ერთი ინსტანციიდან წუთში მაქსიმუმ ერთი მეილი.
let lastSentAt = 0;

export async function register() {}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const reportTo = process.env.ERROR_REPORT_EMAIL;
  if (!reportTo) return;

  const now = Date.now();
  if (now - lastSentAt < 60_000) return;
  lastSentAt = now;

  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) return;

    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });

    const err = error as { message?: string; stack?: string; digest?: string };
    const ua = request.headers["user-agent"];
    const when = new Date(now);

    const text = [
      `დრო (UTC): ${when.toISOString()}`,
      `დრო (თბილისი): ${when.toLocaleString("en-GB", { timeZone: "Asia/Tbilisi" })}`,
      `ERROR (digest): ${err.digest ?? "—"}`,
      `გვერდი: ${request.method} ${request.path}`,
      `route: ${context.routePath} (${context.routeType}, ${context.renderSource ?? "—"})`,
      `ბრაუზერი: ${Array.isArray(ua) ? ua.join(" ") : ua ?? "—"}`,
      `Vercel deployment: ${process.env.VERCEL_DEPLOYMENT_ID ?? "—"}`,
      "",
      `შეცდომა: ${err.message ?? String(error)}`,
      "",
      err.stack ?? "",
    ].join("\n");

    const rawFrom = SMTP_FROM || SMTP_USER;
    const match = rawFrom.match(/<([^>]+)>/);
    const address = (match ? match[1] : rawFrom).trim();

    await transporter.sendMail({
      from: { name: "Tvinion — შეცდომა", address },
      to: reportTo,
      subject: `Tvinion სერვერის შეცდომა: ${request.path}`,
      text,
    });
  } catch {
    // მეილის გაგზავნის შეცდომამ საიტს არაფერი უნდა დაუშალოს
  }
};
