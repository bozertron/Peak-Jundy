import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import Navbar from "@/components/Navigation/Navbar";
import Footer from "@/components/Footer";
import { authOptions } from "@/lib/auth";
import Providers from "@/components/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Peak Rentals - Equipment Rental Marketplace",
  description: "Peer-to-peer heavy equipment rental platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Providers session={session}>
          <Navbar session={session} />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
