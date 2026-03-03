import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
  const commit = (process.env.NEXT_PUBLIC_APP_COMMIT ?? "local").slice(0, 7);

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <div className="fixed bottom-3 right-3 z-50 rounded-md border border-border/80 bg-background/95 px-2 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
          v{version} ({commit})
        </div>
      </body>
    </html>
  );
}
