/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow remote images from common hosts used in seed data + Stripe.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "*.stripe.com" },
    ],
  },
  // TODO(peak): Tighten these once we sweep the legacy TS debt in apps/client.
  // The v0 ship-priority is functional correctness; type-level cleanup follows.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
