import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulation - Corridor Ligné vers Nantes",
  description:
    "Simulation de trafic et impact du covoiturage sur le corridor Ligné vers Nantes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
