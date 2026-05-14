export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const env = {
    platformFeeBps: process.env.PLATFORM_FEE_BPS ?? "1000",
    nextAuthUrl: process.env.NEXTAUTH_URL ?? "(not set)",
    nextAuthSecret: process.env.NEXTAUTH_SECRET ?? "",
    stripeSecret: process.env.STRIPE_SECRET_KEY ?? "",
    stripePublishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    stripeWebhook: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
    emailHost: process.env.EMAIL_SERVER_HOST ?? "",
    emailFrom: process.env.EMAIL_FROM ?? "",
  };

  return (
    <div className="space-y-6">
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          Admin · platform
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
          What&rsquo;s configured
        </h1>
        <p className="text-sm text-peak-charcoal/70 mt-2">
          Read-only view of runtime env. Edit your host&rsquo;s environment
          (Vercel project settings, etc.) to change.
        </p>
      </div>

      <Group title="Money">
        <Row label="Platform fee" value={`${env.platformFeeBps} bps`} />
        <BoolRow label="STRIPE_SECRET_KEY" set={Boolean(env.stripeSecret)} />
        <BoolRow
          label="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
          set={Boolean(env.stripePublishable)}
        />
        <BoolRow
          label="STRIPE_WEBHOOK_SECRET"
          set={Boolean(env.stripeWebhook)}
        />
      </Group>

      <Group title="Identity">
        <Row label="NEXTAUTH_URL" value={env.nextAuthUrl} />
        <BoolRow label="NEXTAUTH_SECRET" set={Boolean(env.nextAuthSecret)} />
        <Row label="EMAIL_FROM" value={env.emailFrom || "(not set)"} />
        <BoolRow label="EMAIL_SERVER_HOST" set={Boolean(env.emailHost)} />
      </Group>

      <Group title="Maps">
        <BoolRow
          label="NEXT_PUBLIC_MAPBOX_TOKEN"
          set={Boolean(env.mapboxToken)}
        />
      </Group>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="peak-frame bg-white rounded-peak overflow-hidden">
      <div className="px-5 py-3 bg-peak-cream/40 border-b border-peak-charcoal/10">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate">
          {title}
        </p>
      </div>
      <dl className="divide-y divide-peak-charcoal/5">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
      <dt className="font-mono text-xs text-peak-charcoal/60">{label}</dt>
      <dd className="text-sm text-peak-charcoal text-right truncate">
        {value}
      </dd>
    </div>
  );
}

function BoolRow({ label, set }: { label: string; set: boolean }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
      <dt className="font-mono text-xs text-peak-charcoal/60">{label}</dt>
      <dd
        className={`text-sm font-medium ${
          set ? "text-peak-forest" : "text-peak-burgundy"
        }`}
      >
        {set ? "configured" : "missing"}
      </dd>
    </div>
  );
}
