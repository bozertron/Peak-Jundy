import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  formatValidationErrors,
  hasErrors,
  validateSearch,
} from "@/lib/validation";
import type { EquipmentSearchRequest } from "@/lib/types";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();

function getClientKey(req: Request, userId: string | null) {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0]?.trim() || "unknown"}`;
  const realIp = req.headers.get("x-real-ip");
  return `ip:${realIp || "unknown"}`;
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimits.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetAt,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EquipmentSearchRequest;
    const { query, category } = body;

    const errors: Record<string, string> = {};
    if (typeof query !== "string") {
      errors.query = "Query must be a string";
    } else {
      Object.assign(errors, validateSearch(query));
    }

    if (category !== undefined && typeof category !== "string") {
      errors.category = "Category must be a string";
    }

    if (hasErrors(errors)) {
      return NextResponse.json(formatValidationErrors(errors), { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    const rateKey = getClientKey(req, userId);
    const rateLimit = checkRateLimit(rateKey);

    if (!rateLimit.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      );
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetAt),
          },
        }
      );
    }

    const trimmedQuery = query.trim();

    const results = await prisma.equipment.findMany({
      where: {
        available: true,
        AND: [
          {
            OR: [
              { title: { contains: trimmedQuery, mode: "insensitive" } },
              { description: { contains: trimmedQuery, mode: "insensitive" } },
              { category: { contains: trimmedQuery, mode: "insensitive" } },
            ],
          },
          ...(category
            ? [{ category: { equals: category, mode: "insensitive" as const } }]
            : []),
        ],
      },
      include: { owner: { select: { name: true, stripeAccountId: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Log unfulfilled searches asynchronously (fire and forget)
    if (results.length === 0) {
      prisma.searchLog
        .create({
          data: {
            query: trimmedQuery,
            fulfilled: false,
            userId,
            timestamp: new Date(),
          },
        })
        .catch((err) => console.error("SearchLog error:", err));
    }

    return NextResponse.json(
      {
        results,
        count: results.length,
        fulfilled: results.length > 0,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    );
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
