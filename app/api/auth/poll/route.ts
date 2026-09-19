import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// მხოლოდ სტატუსს აბრუნებს ("ბმული გამოიყენეს თუ არა") — სესიას არ ქმნის
// და არანაირ წვდომას არ იძლევა. pollId მეილში არ იგზავნება, მხოლოდ იმ
// ეკრანმა იცის, რომელმაც ბმული მოითხოვა.
export async function GET(req: NextRequest) {
  const pollId = req.nextUrl.searchParams.get("id");
  if (!pollId) {
    return NextResponse.json({ used: false });
  }

  const record = await prisma.loginToken.findUnique({
    where: { pollId },
    select: { usedAt: true },
  });

  return NextResponse.json({ used: !!record?.usedAt });
}