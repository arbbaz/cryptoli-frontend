import Credentials from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import { getBackendUrl } from '@/lib/env';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) {
          return null;
        }

        const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          cache: 'no-store',
        });

        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as {
          user?: {
            id: string;
            email: string;
            username: string;
            role: string;
            name?: string | null;
            avatar?: string | null;
            verified?: boolean;
            reputation?: number;
          };
        };

        if (!payload.user) {
          return null;
        }

        return {
          id: payload.user.id,
          email: payload.user.email,
          name: payload.user.username,
          username: payload.user.username,
          role: payload.user.role,
          avatar: payload.user.avatar ?? null,
          verified: payload.user.verified ?? false,
          reputation: payload.user.reputation ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user as typeof token.user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as typeof session.user;
      }
      return session;
    },
  },
};
