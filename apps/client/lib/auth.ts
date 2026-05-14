import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";

const emailServerHost = process.env.EMAIL_SERVER_HOST ?? "localhost";
const emailServerPort = Number(process.env.EMAIL_SERVER_PORT || 587);
const emailServerUser = process.env.EMAIL_SERVER_USER ?? "";
const emailServerPassword = process.env.EMAIL_SERVER_PASSWORD ?? "";
const emailFrom = process.env.EMAIL_FROM ?? "Peak <noreply@peak.local>";
const authSecret = process.env.NEXTAUTH_SECRET;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: emailServerHost,
        port: emailServerPort,
        auth: {
          user: emailServerUser,
          pass: emailServerPassword,
        },
      },
      from: emailFrom,
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? "USER";
        session.user.stripeAccountId = user.stripeAccountId ?? null;
      }
      return session;
    },
  },
  ...(authSecret ? { secret: authSecret } : {}),
};
