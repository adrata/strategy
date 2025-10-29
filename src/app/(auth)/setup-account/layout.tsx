import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Account | Adrata",
  description: "Complete your account setup to access Adrata's intelligent sales platform.",
  robots: "noindex, nofollow", // Don't index setup pages
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function SetupAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
