import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const accountId = user.stripeAccountId || (await stripeService.createConnectedAccount(userId));
    const url = await stripeService.createAccountLink(accountId);

    // Ensure role is OWNER once they start onboarding (optional but useful)
    if (user.role === "USER") {
      await prisma.user.update({ where: { id: userId }, data: { role: "OWNER" } });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Stripe connect error:", error);
    return NextResponse.json({ error: "Failed to connect Stripe" }, { status: 500 });
  }
}
