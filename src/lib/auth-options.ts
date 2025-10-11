import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  // Using JWT strategy instead of database adapter for now
  providers: [
    // Add your authentication providers here
    // For now, using a simple email provider for development
  ],
  session: {
    strategy: 'jwt',
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
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
