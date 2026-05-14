export default function AdminSettingsPage() {
  const platformFeeBps = process.env.PLATFORM_FEE_BPS ?? "1000";
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? "Not set";
  const stripeSecretConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const publishableConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Read-only view of current runtime configuration.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4 text-sm text-gray-700">
        <div className="flex items-center justify-between">
          <span>Platform fee (bps)</span>
          <span className="font-semibold">{platformFeeBps}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>NEXTAUTH_URL</span>
          <span className="font-semibold">{nextAuthUrl}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Stripe secret key</span>
          <span className={stripeSecretConfigured ? "text-green-700" : "text-red-700"}>
            {stripeSecretConfigured ? "Configured" : "Missing"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Stripe publishable key</span>
          <span className={publishableConfigured ? "text-green-700" : "text-red-700"}>
            {publishableConfigured ? "Configured" : "Missing"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Stripe webhook secret</span>
          <span className={webhookConfigured ? "text-green-700" : "text-red-700"}>
            {webhookConfigured ? "Configured" : "Missing"}
          </span>
        </div>
      </div>
    </div>
  );
}
