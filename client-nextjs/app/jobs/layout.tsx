import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Jobs | Employ.me",
  description: "Search and apply for the latest job opportunities in Ghana. Find your next career move with top employers.",
  openGraph: {
    title: "Browse Jobs | Employ.me",
    description: "Search and apply for the latest job opportunities in Ghana. Find your next career move with top employers.",
  }
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
