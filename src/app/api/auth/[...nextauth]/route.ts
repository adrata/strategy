import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
