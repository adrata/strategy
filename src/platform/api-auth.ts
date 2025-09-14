import { type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  workspaceId?: string;
};

export async function getUnifiedAuthUser(
  req: NextRequest,
): Promise<AuthUser | null> {
  console.log("🔍 API Auth: Checking authentication...");

  try {
    // 1. Try JWT token from cookie (web auth)
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key && value) acc[key] = decodeURIComponent(value);
          return acc;
        },
        {} as Record<string, string>,
      );

      const token = cookies["auth-token"];
      if (token) {
        try {
          const secret = process['env']['NEXTAUTH_SECRET'] || "dev-secret";
          const decoded = jwt.verify(token, secret) as any;

          console.log("✅ API Auth: Valid token for:", decoded.email);

          return {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            name: decoded.name,
            workspaceId: decoded.workspaceId || "local-workspace",
          };
        } catch (jwtError) {
          console.warn("⚠️ API Auth: JWT verification failed:", jwtError);
        }
      }
    }

    // 2. Try Authorization header (Bearer token)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1] || "";
        if (!token) {
          console.warn("⚠️ API Auth: No token found in Bearer header");
          return null;
        }
        const secret = process['env']['NEXTAUTH_SECRET'] || "dev-secret";
        const decoded = jwt.verify(token, secret) as any;

        console.log("✅ API Auth: Valid bearer token for:", decoded.email);

        return {
          id: decoded.userId || decoded.id,
          email: decoded.email,
          name: decoded.name,
          workspaceId: decoded.workspaceId || "local-workspace",
        };
      } catch (jwtError) {
        console.warn(
          "⚠️ API Auth: Bearer token verification failed:",
          jwtError,
        );
      }
    }

    console.log("❌ API Auth: No valid authentication found");
    return null;
  } catch (error) {
    console.error("❌ API Auth: Error during authentication check:", error);
    return null;
  }
}
