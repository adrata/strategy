import { Session } from "next-auth";
import { prisma } from "./prisma";

export async function getWorkspaceFromSession(session: Session) {
  if (!session.user?.email) return null;

  // Get the user's primary workspace
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      user: {
        email: session.user.email,
      },
    },
    include: {
      workspace: true,
    },
  });

  return membership?.workspace || null;
}
