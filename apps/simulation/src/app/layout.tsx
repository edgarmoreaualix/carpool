import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulation — Corridor Ligné → Nantes",
  description:
    "Simulation de trafic et impact du covoiturage sur le corridor Ligné → Nantes.",
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
