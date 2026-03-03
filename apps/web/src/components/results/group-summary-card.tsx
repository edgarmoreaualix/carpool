import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResultMember } from "./types";

export function GroupSummaryCard({ members }: { members: ResultMember[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Votre groupe de la semaine</CardTitle>
        <CardDescription>Les voisins compatibles avec vos horaires et votre corridor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => (
          <article key={member.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {member.name
                .split(" ")
                .map((chunk) => chunk[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-foreground">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.commune}</p>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
