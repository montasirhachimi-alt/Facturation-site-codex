import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HicoPilot",
  description: "Plateforme de gestion intelligente pour PME"
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
