import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS || 1000); // 10%

let stripeClient: Stripe | null = null;

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    // Use account's pinned API version (per Stripe dashboard).
    // Avoids type drift when SDK is upgraded.
    stripeClient = new Stripe(apiKey);
  }

  return stripeClient;
}

async function createConnectedAccount(
  userId: string,
  options?: { displayName?: string; contactEmail?: string }
) {
  const stripe = getStripeClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  if (user.stripeAccountId) {
    throw new Error("User already has a Stripe account");
  }

  const accountParams: Stripe.AccountCreateParams = {
    type: "express",
    country: "US",
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
  };

  const email = options?.contactEmail ?? user.email ?? undefined;
  if (email) accountParams.email = email;

  if (options?.displayName) {
    accountParams.business_profile = { name: options.displayName };
  }

  const account = await stripe.accounts.create(accountParams);

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });

  return account.id;
}

async function createAccountLink(accountId: string) {
  const stripe = getStripeClient();
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL is not configured");
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/owner/reauth`,
    return_url: `${baseUrl}/owner/dashboard`,
    type: "account_onboarding",
  });

  return link.url;
}

async function createCheckoutSession(params: {
  equipmentId: string;
  dailyRate: number; // cents
  days: number;
  renterId: string;
  ownerStripeAccountId: string;
  equipmentTitle?: string;
  equipmentDescription?: string;
}) {
  const stripe = getStripeClient();
  const totalAmount = params.dailyRate * params.days;
  const applicationFee = Math.round((totalAmount * PLATFORM_FEE_BPS) / 10000);

  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL is not configured");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name:
              params.equipmentTitle ||
              `Equipment Rental (${params.days} day${params.days === 1 ? "" : "s"})`,
            ...(params.equipmentDescription
              ? { description: params.equipmentDescription }
              : {}),
          },
          unit_amount: totalAmount,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFee,
      transfer_data: { destination: params.ownerStripeAccountId },
    },
    success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/booking/cancel`,
    metadata: {
      equipmentId: params.equipmentId,
      renterId: params.renterId,
      days: String(params.days),
    },
  });

  return session;
}

async function getAccountStatus(accountId: string) {
  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(accountId);
  const chargesEnabled = account.charges_enabled === true;
  const payoutsEnabled = account.payouts_enabled === true;
  const currentlyDue = account.requirements?.currently_due || [];
  const pastDue = account.requirements?.past_due || [];
  const hasUnmetRequirements = currentlyDue.length > 0 || pastDue.length > 0;

  return {
    id: account.id,
    accountId: account.id,
    charges_enabled: account.charges_enabled,
    details_submitted: account.details_submitted,
    requirements: account.requirements,
    readyToReceivePayments: chargesEnabled && payoutsEnabled,
    readyForPayments: chargesEnabled && payoutsEnabled && !hasUnmetRequirements,
    hasUnmetRequirements,
    requirementsStatus: account.requirements?.eventually_due ? "Pending" : "Active",
    currentlyDue,
    pastDue,
  };
}

async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId);
}

async function retrieveSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
}

async function handleWebhookEvent(rawBody: string, signature: string) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    webhookSecret
  );

  // Handle event types we care about
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const equipmentId = session.metadata?.equipmentId;
    const renterId = session.metadata?.renterId;
    const days = Number(session.metadata?.days || 1);
    const amountTotal = session.amount_total ?? 0;

    if (!equipmentId || !renterId) return;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.max(1, days));

    // Update booking if it exists, else create
    const existing = await prisma.booking.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: {
          status: "CONFIRMED",
          totalPrice: amountTotal,
          startDate,
          endDate,
        },
      });
    } else {
      await prisma.booking.create({
        data: {
          equipmentId,
          renterId,
          startDate,
          endDate,
          totalPrice: amountTotal,
          status: "CONFIRMED",
          stripeSessionId: session.id,
        },
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const existing = await prisma.booking.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: "stripe_session_expired",
        },
      });
    }
  }

  return { received: true };
}

export const stripeService = {
  createConnectedAccount,
  createAccountLink,
  createProduct,
  getProducts,
  createCheckoutSession,
  getAccountStatus,
  retrieveCheckoutSession,
  retrieveSession,
  handleWebhookEvent,
  validateWebhookSignature,
};

async function createProduct(params: {
  name: string;
  description: string;
  priceInCents: number;
  connectedAccountId: string;
  equipmentId?: string;
}) {
  const stripe = getStripeClient();
  return stripe.products.create({
    name: params.name,
    description: params.description,
    default_price_data: {
      unit_amount: params.priceInCents,
      currency: "usd",
    },
    metadata: {
      connected_account_id: params.connectedAccountId,
      equipment_id: params.equipmentId || "",
    },
  });
}

async function getProducts() {
  const stripe = getStripeClient();
  const products = await stripe.products.list({
    limit: 100,
    expand: ["data.default_price"],
  });

  return products.data;
}

function validateWebhookSignature(body: string | Buffer, signature: string) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
