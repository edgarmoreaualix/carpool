import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Créer mon compte</CardTitle>
          <CardDescription>Commencez votre onboarding en moins de 2 minutes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Prénom</Label>
            <Input id="name" type="text" placeholder="Marie" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="marie@exemple.fr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" placeholder="Au moins 8 caractères" />
          </div>
          <Button className="w-full">Créer mon compte</Button>
          <p className="text-sm text-muted-foreground">
            Déjà inscrit(e) ?{" "}
            <Link href="/login" className="text-primary underline underline-offset-4">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
