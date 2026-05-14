import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const daysParam = Number(searchParams.get("days"));
    const minCountParam = Number(searchParams.get("minCount"));
    const queryFilter = (searchParams.get("query") || "").trim().toLowerCase();

    const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const grouped = await prisma.searchLog.groupBy({
      by: ["query"],
      where: { fulfilled: false, timestamp: { gte: since } },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 100,
    });

    let filtered = grouped;
    if (queryFilter) {
      filtered = filtered.filter((row) =>
        row.query.toLowerCase().includes(queryFilter)
      );
    }

    const minCount =
      Number.isFinite(minCountParam) && minCountParam > 0
        ? minCountParam
        : 0;
    if (minCount > 0) {
      filtered = filtered.filter((row) => row._count.query >= minCount);
    }

    const topSearches = filtered.slice(0, 50);

    return NextResponse.json({
      topSearches,
      meta: { days, minCount, query: queryFilter },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
