/**
 * Owner Onboarding & Status Component
 *
 * This component shows owners their Stripe Connect onboarding status and
 * provides a button to complete onboarding if not yet done.
 *
 * It displays:
 * - Current account status (onboarding, ready for payments, etc)
 * - Any requirements that need to be completed
 * - Button to start/resume onboarding
 */

"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

interface AccountStatus {
  accountId: string;
  readyForPayments: boolean;
  readyToReceivePayments: boolean;
  hasUnmetRequirements: boolean;
  requirementsStatus: string;
  currentlyDue: string[];
  pastDue: string[];
}

export default function OwnerOnboardingDashboard() {
  const { data: session, status } = useSession();
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const stripeAccountId = session?.user?.stripeAccountId ?? null;

  /**
   * Fetches the current account status from the API
   * This shows requirements, capabilities, and payment readiness
   */
  const fetchAccountStatus = useCallback(async () => {
    if (!stripeAccountId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/stripe/connect/account-status?accountId=${stripeAccountId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch account status");
      }

      const data = await response.json();
      setAccountStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching account status:", err);
    } finally {
      setIsLoading(false);
    }
  }, [stripeAccountId]);

  // Fetch the account status when component mounts or when stripeAccountId changes
  useEffect(() => {
    if (stripeAccountId) {
      fetchAccountStatus();
    }
  }, [fetchAccountStatus, stripeAccountId]);

  /**
   * Creates a new Stripe Connect account for this owner
   * This is called the first time an owner starts the onboarding process
   */
  const createConnectedAccount = async () => {
    setIsCreatingAccount(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/connect/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: session?.user?.name || "Equipment Owner",
          contactEmail: session?.user?.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create account");
      }

      const data = await response.json();

      // Account created, now redirect to onboarding
      if (data.accountId) {
        redirectToOnboarding(data.accountId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error creating account:", err);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  /**
   * Redirects the user to Stripe's onboarding flow
   * This opens Stripe-hosted pages where they complete identity verification
   * and add banking information for payouts
   */
  const redirectToOnboarding = async (accountId: string) => {
    try {
      const response = await fetch(
        `/api/stripe/connect/onboarding-link?accountId=${accountId}`
      );

      if (!response.ok) {
        throw new Error("Failed to generate onboarding link");
      }

      const data = await response.json();

      // Redirect to Stripe's onboarding page
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start onboarding");
      console.error("Error starting onboarding:", err);
    }
  };

  // Handle loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Handle not signed in
  if (status === "unauthenticated") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">
          Please sign in to manage your account onboarding.
        </p>
      </div>
    );
  }

  // Not yet an owner or onboarding not started
  if (!stripeAccountId) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          Get Started with Stripe Connect
        </h2>
        <p className="text-blue-800 mb-6">
          Connect your bank account to start receiving payments from equipment
          rentals. This is a one-time setup.
        </p>
        <button
          onClick={createConnectedAccount}
          disabled={isCreatingAccount}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isCreatingAccount ? "Setting up..." : "Create Connected Account"}
        </button>
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    );
  }

  // Account exists - show status
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Stripe Account Status
      </h2>

      {/* Loading state */}
      {isLoading && <p className="text-gray-600">Loading account status...</p>}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4">
          {error}
          <button
            onClick={fetchAccountStatus}
            className="ml-4 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Status displays */}
      {accountStatus && (
        <>
          {/* Ready for payments */}
          {accountStatus.readyForPayments && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">✅</div>
                <div>
                  <h3 className="font-semibold text-green-900">
                    Ready to Receive Payments
                  </h3>
                  <p className="text-green-800 text-sm">
                    Your account is fully onboarded and ready to receive rental
                    payments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Has unmet requirements */}
          {accountStatus.hasUnmetRequirements && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="text-2xl mr-3">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Action Required
                  </h3>
                  <p className="text-yellow-800 text-sm mb-4">
                    Your account requires additional information to complete
                    onboarding.
                  </p>

                  {/* List requirements */}
                  {accountStatus.currentlyDue.length > 0 && (
                    <div className="mb-3">
                      <p className="text-yellow-900 font-medium text-sm mb-2">
                        Currently Due:
                      </p>
                      <ul className="list-disc list-inside text-yellow-800 text-sm">
                        {accountStatus.currentlyDue.map((req) => (
                          <li key={req}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Overdue requirements */}
                  {accountStatus.pastDue.length > 0 && (
                    <div className="mb-3 bg-red-100 rounded p-2">
                      <p className="text-red-900 font-medium text-sm mb-2">
                        ⚠️ Overdue:
                      </p>
                      <ul className="list-disc list-inside text-red-900 text-sm">
                        {accountStatus.pastDue.map((req) => (
                          <li key={req}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => redirectToOnboarding(accountStatus.accountId)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm"
                  >
                    Complete Onboarding
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account ready for payments but not enabled yet */}
          {!accountStatus.readyForPayments && !accountStatus.hasUnmetRequirements && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-2xl mr-3">🔄</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Finishing Setup
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Your account is being finalized. This usually takes 24-48
                    hours. You&apos;ll receive an email when you&apos;re ready
                    to receive payments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Account info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-medium">Account ID:</span>{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  {accountStatus.accountId}
                </code>
              </p>
              <p className="mt-2">
                <span className="font-medium">Status:</span>{" "}
                {accountStatus.requirementsStatus || "Unknown"}
              </p>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchAccountStatus}
            disabled={isLoading}
            className="mt-6 text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400"
          >
            {isLoading ? "Refreshing..." : "Refresh Status"}
          </button>
        </>
      )}
    </div>
  );
}
