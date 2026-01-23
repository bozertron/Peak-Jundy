import { stripeService } from "@/lib/stripe";
import Link from "next/link";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  const session = sessionId ? await stripeService.retrieveCheckoutSession(sessionId) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border rounded-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
        <p className="text-gray-600 mb-6">
          Your booking has been submitted. You&apos;ll see it under <b>My Rentals</b>.
        </p>

        {session && (
          <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700 mb-6">
            <div><b>Session:</b> {session.id}</div>
            <div><b>Amount:</b> {(session.amount_total ?? 0) / 100} USD</div>
            <div><b>Status:</b> {session.payment_status}</div>
          </div>
        )}

        <div className="flex gap-3">
          <Link className="btn-primary" href="/dashboard/rentals">View My Rentals</Link>
          <Link className="btn-secondary" href="/browse">Browse more</Link>
        </div>
      </div>
    </div>
  );
}
