import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        password: { label: "Password", type: "password" },
        isNewUser: { label: "Is New User", type: "boolean" },
      },
      async authorize(credentials, req) {
        if (!credentials?.password) {
          return null;
        }

        // Get the first user (since we only have one admin user)
        const user = await prisma.user.findFirst();

        if (!user) {
          // If no user exists and this is a new user setup, create one
          if (credentials.isNewUser) {
            const hashedPassword = await hash(credentials.password, 10);
            const newUser = await prisma.user.create({
              data: {
                password: hashedPassword,
              },
            });
            return { id: newUser.id.toString(), password: newUser.password };
          }
          return null;
        }

        // If user exists but has no password, only allow setting password
        if (!user.password) {
          if (credentials.isNewUser) {
            const hashedPassword = await hash(credentials.password, 10);
            await prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword },
            });
            return { id: user.id.toString(), password: hashedPassword };
          }
          return null;
        }

        // If user has password, verify it
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return { id: user.id.toString(), password: user.password };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour in seconds
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 