"use client";

import type { BoardState } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  state: BoardState;
};

export function GodModePanel({ state }: Props) {
  const allTasks = Object.values(state.tasks);
  
  const evaluated = allTasks.filter(t => typeof t.rubricScore === "number");
  const pending = allTasks.filter(t => typeof t.rubricScore !== "number");
  
  const avgScore = evaluated.length > 0
    ? evaluated.reduce((sum, t) => sum + (t.rubricScore ?? 0), 0) / evaluated.length
    : 0;

  return (
    <Card className="rounded-md bg-muted/30">
      <CardHeader>
        <CardTitle className="text-lg">Panel Resumen - Modo Dios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{allTasks.length}</p>
            <p className="text-sm text-muted-foreground">Tareas totales</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{evaluated.length}</p>
            <p className="text-sm text-muted-foreground">Evaluadas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{pending.length}</p>
            <p className="text-sm text-muted-foreground">Sin evaluar</p>
          </div>
        </div>

        {evaluated.length > 0 && (
          <div className="mt-4 border-t pt-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {avgScore.toFixed(1)}/10
            </p>
            <p className="text-sm text-muted-foreground">Media de rúbricas</p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            ⚠️ Hay {pending.length} tarea{pending.length !== 1 ? "s" : ""} sin evaluar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
