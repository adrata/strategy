// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET() {
  return Response.json({ message: 'Simple API works' });
}
