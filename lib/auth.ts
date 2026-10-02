import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const adapter = process.env.DATABASE_URL ? PrismaAdapter(new PrismaClient()) : undefined;

export const authOptions: NextAuthOptions = {
  // Keeping the adapter conditional lets a source checkout build before its
  // PostgreSQL environment is provisioned. Production must set DATABASE_URL.
  adapter,
  secret: process.env.NEXTAUTH_SECRET ?? "development-only-secret-change-before-production",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "unconfigured-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "unconfigured-google-client-secret",
    }),
  ],
  session: { strategy: "database" },
  pages: { signIn: "/" },
};
