import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { activeGrant, members, MONTH, revokeGrant, verifyCode } from './identity';

export const refreshCookie =
  process.env.NODE_ENV === 'production' ? '__Host-nomasoft.session' : 'nomasoft.session';
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/crm/login' },
  cookies: {
    sessionToken: {
      name: refreshCookie,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
  session: { strategy: 'jwt', maxAge: MONTH },
  providers: [
    CredentialsProvider({
      name: 'Email code',
      credentials: { email: { type: 'email' }, code: { type: 'text' } },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() || '';
        const grant = await verifyCode(email, credentials?.code || '');
        if (!grant) return null;
        return { id: grant, email, name: members.get(email) };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) return { ...token, sub: user.id };
      if (
        token.email &&
        token.sub &&
        members.has(token.email) &&
        (await activeGrant(token.email, token.sub))
      )
        return token;
      return {};
    },
    async session({ session, token }) {
      session.user =
        token.email && members.has(token.email)
          ? { email: token.email, name: members.get(token.email) }
          : undefined;
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ('token' in message && message.token?.email && message.token.sub)
        await revokeGrant(message.token.email, message.token.sub);
    },
  },
};
