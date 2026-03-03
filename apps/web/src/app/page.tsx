import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const simulationUrl = process.env.NEXT_PUBLIC_SIMULATION_URL ?? "http://localhost:3001";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:py-12">
      <section className="grid gap-5 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Covoiturage IA rural</p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Moins de voitures solo, plus de voisins connectés
          </h1>
          <p className="text-muted-foreground">
            Déclarez vos lieux et votre semaine. Le moteur de matching construit un plan de pickup clair pour chaque jour.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/onboarding/location" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Déclarer mon trajet
            </Link>
            <Link href="/results" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground">
              Voir un exemple de résultat
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Simulation corridor Ligné vers Nantes</CardTitle>
            <CardDescription>Visualisation before/after du trafic et de l'impact CO2.</CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              title="Simulation Covoiturage"
              src={simulationUrl}
              className="h-[360px] w-full rounded-md border border-border"
            />
            <div className="mt-3 text-sm text-muted-foreground">
              <Link href={simulationUrl} target="_blank" className="text-primary underline underline-offset-4">
                Ouvrir la simulation dans un nouvel onglet
              </Link>
              . Si l&apos;aperçu est vide, vérifiez que l&apos;app simulation tourne sur l&apos;URL configurée.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature title="Planning hebdomadaire" description="Mon-Fri avec tolérance et variabilité." />
        <Feature title="Matching corridor" description="Groupes compatibles en géographie et horaires." />
        <Feature title="Plan quotidien" description="Qui conduit, ordre de pickup, heures claires." />
      </section>
    </main>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
