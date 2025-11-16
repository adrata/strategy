import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Required for static export
export async function generateStaticParams() {
  // Return empty array for dynamic routes that don't need pre-generation
  return [];
}

export default async function WorkspacePipelinePage({
  params,
}: {
  params: { workspace: string };
}) {
  try {
    // Check if this is Ryan in Notary Everyday workspace
    const session = await getServerSession(authOptions);
    
    if (session?.user?.email && session.user.email.toLowerCase().includes('ryan')) {
      // Get workspace to check if it's Notary Everyday
      const workspace = await prisma.workspaces.findFirst({
        where: {
          OR: [
            { slug: params.workspace },
            { name: { contains: 'Notary Everyday', mode: 'insensitive' } }
          ]
        }
      });

      if (workspace && (workspace.name.toLowerCase().includes('notary') || workspace.slug === 'ne' || workspace.slug === 'notary-everyday')) {
        // Redirect Ryan to ExpansionOS
        redirect('./expansion-os/prospects');
      }
    }
  } catch (error) {
    console.error('Error checking user for OS redirect:', error);
    // Fall through to default redirect
  } finally {
    await prisma.$disconnect();
  }

  // Default redirect to Dashboard
  redirect('./dashboard');
}
