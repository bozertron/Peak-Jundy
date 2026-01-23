import { NextResponse } from "next/server";
import { stripeService } from "@/lib/stripe";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();

  try {
    const result = await stripeService.handleWebhookEvent(rawBody, signature);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Webhook error:", err);
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
