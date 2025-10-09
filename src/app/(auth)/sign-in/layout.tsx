import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Adrata",
  description: "Sign in to your Adrata account to access buyer group intelligence and deal insights.",
  robots: "noindex, nofollow", // Don't index sign-in pages
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
