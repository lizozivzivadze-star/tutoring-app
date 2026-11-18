import { NextResponse } from "next/server";
import { computePublicStats } from "@/lib/public-stats";

export const dynamic = "force-dynamic";

// login გვერდის საჯარო სტატისტიკა. მხოლოდ რაოდენობებს აბრუნებს,
// პირად მონაცემს არაფერს. გამოთვლა lib/public-stats.ts-შია.
export async function GET() {
  const stats = await computePublicStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
    },
  });
}
