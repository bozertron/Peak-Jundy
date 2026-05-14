import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth/next";
import Navbar from "@/components/Navigation/Navbar";
import Footer from "@/components/Footer";
import { authOptions } from "@/lib/auth";
import Providers from "@/components/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Peak",
    template: "%s · Peak",
  },
  description: "Equipment rental, the way mountain communities already trust each other.",
  applicationName: "Peak",
};

export const viewport: Viewport = {
  themeColor: "#2D5A47",
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
