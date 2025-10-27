// Desktop build - API routes excluded for static export
export const dynamic = "force-static";

export async function GET() {
  return new Response('Desktop API routes disabled', { status: 404 });
}
