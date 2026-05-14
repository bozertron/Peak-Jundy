import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const daysParam = Number(searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;
  const since = new Date();
  since.setDate(since.getDate() - Math.max(1, days));

  try {
    const gaps = await prisma.searchLog.groupBy({
      by: ["query"],
      where: { fulfilled: false, timestamp: { gte: since } },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 50,
    });

    return NextResponse.json({ since, gaps });
  } catch (e) {
    console.error("Market gaps error:", e);
    return NextResponse.json({ error: "Failed to fetch market gaps" }, { status: 500 });
  }
}
