/**
 * API Route: Create Product
 *
 * POST /api/stripe/products
 *
 * Creates a Stripe Product that represents an item available for purchase.
 * In Peak Rentals, products represent equipment that can be rented.
 *
 * Request body:
 * {
 *   name: string (equipment name)
 *   description: string (equipment description)
 *   priceInCents: number (rental rate in cents)
 *   connectedAccountId: string (owner's Stripe account ID)
 *   equipmentId?: string (link to equipment record)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   product: {
 *     id: string (Stripe product ID)
 *     name: string
 *     description: string
 *     default_price: string (Stripe price ID)
 *     metadata: object
 *   }
 *   error?: string (if failed)
 * }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";
import type { StripeProductRequest } from "@/lib/types";

export async function POST(req: Request) {
  try {
    // Verify the user is authenticated and is an owner
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Check if user is an owner
    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden - only owners can create products" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = (await req.json()) as StripeProductRequest;
    const {
      name,
      description,
      priceInCents,
      connectedAccountId,
      equipmentId,
    } = body;

    // Validate required fields
    if (!name || !description || !priceInCents || !connectedAccountId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, description, priceInCents, connectedAccountId",
        },
        { status: 400 }
      );
    }

    // Validate that price is a positive number
    if (typeof priceInCents !== "number" || priceInCents <= 0) {
      return NextResponse.json(
        { error: "priceInCents must be a positive number" },
        { status: 400 }
      );
    }

    // Create the product with Stripe
    const product = await stripeService.createProduct({
      name,
      description,
      priceInCents,
      connectedAccountId,
      ...(equipmentId ? { equipmentId } : {}),
    });

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create product",
      },
      { status: 500 }
    );
  }
}
