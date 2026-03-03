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
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
  const commit = (process.env.NEXT_PUBLIC_APP_COMMIT ?? "local").slice(0, 7);

  return (
    <html lang="fr">
      <body>
        {children}
        <div
          style={{
            position: "fixed",
            right: 12,
            bottom: 12,
            zIndex: 50,
            border: "1px solid rgba(35,49,38,0.2)",
            borderRadius: 8,
            background: "rgba(255,249,240,0.92)",
            padding: "4px 8px",
            fontSize: 11,
            color: "#5f6c62",
          }}
        >
          v{version} ({commit})
        </div>
      </body>
    </html>
  );
}
