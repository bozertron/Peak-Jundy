import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeService } from "@/lib/stripe";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.stripeAccountId) {
    return NextResponse.json({ hasAccount: false });
  }

  try {
    const status = await stripeService.getAccountStatus(user.stripeAccountId);
    return NextResponse.json({ hasAccount: true, ...status });
  } catch (e) {
    console.error("Account status error:", e);
    return NextResponse.json({ error: "Failed to retrieve Stripe status" }, { status: 500 });
  }
}
