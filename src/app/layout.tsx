import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HICOTECH ERP",
  description: "ERP SaaS multi-entreprises HICOTECH"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
