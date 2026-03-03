"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProfile } from "@/lib/flow-store";
import { trpcClient } from "@/lib/trpc-client";

export default function RegisterPage() {
  const [name, setName] = useState("Marie");
  const [email, setEmail] = useState("marie@exemple.fr");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await trpcClient.user.register.mutate({ name, email });
      saveProfile({
        userId: result.userId,
        name,
        email,
        home: { lat: 47.3556, lng: -1.3478, commune: "Ligné" },
        work: { lat: 47.2184, lng: -1.5536, commune: "Nantes Centre" },
      });
      window.location.href = "/onboarding/location";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
            <Input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Au moins 8 caractères" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={loading || !name || !email} onClick={handleRegister}>
            {loading ? "Création..." : "Créer mon compte"}
          </Button>
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
