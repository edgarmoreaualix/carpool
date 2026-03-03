import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Covoiturage — Partagez vos trajets",
  description:
    "Covoiturage intelligent pour les trajets quotidiens campagne → ville. Déclarez vos horaires, trouvez vos voisins.",
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
