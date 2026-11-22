import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/lib/auth";
import { generateAccessCode } from "@/lib/access-code";

const DASHBOARD_BY_ROLE: Record<"teacher" | "student" | "admin" | "tester", string> = {
  teacher: "/dashboard/teacher",
  student: "/dashboard/student",
  admin: "/dashboard/admin",
  tester: "/dashboard/tester",
};

// ღია რეგისტრაციით მოსული ახალი ანგარიში. თუ ეს მეილი უკვე რომელიმე
// ანგარიშს ეკუთვნის (მაგ. ორი ბმული მოითხოვა), ახალს აღარ ვქმნით.
async function createRegisteredAccount(email: string, role: string) {
  if (role !== "teacher" && role !== "student") return;
  const ci = { equals: email, mode: "insensitive" as const };
  const [teacher, student, admin, tester] = await Promise.all([
    prisma.teacher.findFirst({ where: { email: ci }, select: { id: true } }),
    prisma.student.findFirst({ where: { email: ci }, select: { id: true } }),
    prisma.admin.findFirst({ where: { identityEmail: ci }, select: { id: true } }),
    prisma.tester.findFirst({ where: { identityEmail: ci }, select: { id: true } }),
  ]);
  if (teacher || student || admin || tester) return;

  try {
    if (role === "teacher") {
      await prisma.teacher.create({ data: { email } });
    } else {
      // ჯგუფის გარეშე; მასწავლებელი მერე ამ მეილს ჯგუფში დაამატებს
      await prisma.student.create({
        data: { email, accessCode: await generateAccessCode() },
      });
    }
  } catch {
    // ერთდროული მოთხოვნისას მეორემ უკვე შექმნა (unique email) — ყველაფერი რიგზეა
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/login", req.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const record = await prisma.loginToken.findUnique({ where: { token } });

  const isInvalid =
    !record || record.usedAt || record.expiresAt < new Date();

  if (isInvalid) {
    const session = await auth();
    if (session?.user?.role) {
      const dest = DASHBOARD_BY_ROLE[session.user.role];
      return NextResponse.redirect(new URL(dest, req.url));
    }
    // ბმული ახლახან დადასტურდა (მაგ. ბრაუზერმა გვერდი ხელახლა ჩატვირთა) —
    // "/login"-ის ნაცვლად დადასტურების გვერდს ვაჩვენებთ.
    if (
      record?.usedAt &&
      Date.now() - record.usedAt.getTime() < 10 * 60 * 1000
    ) {
      return NextResponse.redirect(new URL("/login/continue?confirmed=1", req.url));
    }
    return NextResponse.redirect(loginUrl);
  }

  // GET-ზე ტოკენს აღარ ვხმარებთ — სასწავლო/კორპორატიული მეილების
  // Safe Links სკანერები ავტომატურად ხსნიან ბმულს ჯერ კიდევ ნამდვილ
  // დაწკაპუნებამდე, რაც ერთჯერად ტოკენს ადრეულად წვავს. ამის ნაცვლად
  // ნამდვილ ბრაუზერს ვაგზავნით გვერდზე, სადაც რეალურ დაწკაპუნებას
  // ველოდებით (იხ. POST ქვემოთ).
  return NextResponse.redirect(
    new URL(`/login/continue?token=${token}`, req.url)
  );
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/login", req.url);
  // mode=confirm: ბმულს მხოლოდ ვადასტურებთ (usedAt), ამ ბრაუზერს კი არ
  // ვაშვებთ. სესიას ბმულის მომთხოვნი ფანჯარა (აპი) იღებს /api/auth/claim-ით.
  const confirmOnly = req.nextUrl.searchParams.get("mode") === "confirm";

  if (!token) {
    return confirmOnly
      ? NextResponse.json({ ok: false }, { status: 400 })
      : NextResponse.redirect(loginUrl);
  }

  const record = await prisma.loginToken.findUnique({ where: { token } });

  const isInvalid =
    !record || record.usedAt || record.expiresAt < new Date();

  if (isInvalid) {
    return confirmOnly
      ? NextResponse.json({ ok: false }, { status: 400 })
      : NextResponse.redirect(loginUrl);
  }

  // usedAt-ს ვნიშნავთ, რომ ორიგინალმა ფანჯარამ (claim route-ით)
  // ფონზე ისიც შეიყვანოს. ეს ბრაუზერი კი პირდაპირ აქვე შედის.
  await prisma.loginToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  // ღია რეგისტრაცია: მეილი დადასტურდა → ანგარიშს ახლა ვქმნით
  if (record.register) {
    await createRegisteredAccount(record.email, record.role);
  }

  if (confirmOnly) {
    return NextResponse.json({ ok: true });
  }

  const destination = DASHBOARD_BY_ROLE[record.role];

  try {
    await signIn("internal", {
      email: record.email,
      role: record.role,
      internalSecret: process.env.INTERNAL_AUTH_SECRET,
      redirectTo: destination,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.redirect(loginUrl);
    }
    throw err;
  }
}