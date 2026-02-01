"use client";

import * as React from "react";
import type { Task } from "@/types";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  task: Task;
  dragDisabled: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;

  // ✅ FASE 10
  godMode: boolean;
  onEvaluate?: (taskId: string) => void;
};

function priorityLabel(p: Task["priority"]) {
  if (p === "high") return "High";
  if (p === "medium") return "Medium";
  return "Low";
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

export function TaskCard({
  task,
  dragDisabled,
  onEdit,
  onDelete,
  godMode,
  onEvaluate,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: dragDisabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const due = formatDate(task.dueAtISO);

  const hasScore = typeof task.rubricScore === "number";
  const hasComment = !!task.rubricComment?.trim();
  const hasNotes = !!task.javiNotes?.trim();

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="hover:bg-muted/40 transition-colors">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex items-start gap-2">
              {/* Drag handle: listeners solo en el handle */}
              <button
                type="button"
                className="mt-0.5 cursor-grab rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Arrastrar tarea"
                disabled={dragDisabled}
                {...listeners}
              >
                ::
              </button>

              <div className="min-w-0">
                <h3 className="font-medium leading-5 truncate">{task.title}</h3>
                {task.description ? (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                ) : null}
              </div>
            </div>

            <Badge variant="secondary">{priorityLabel(task.priority)}</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {task.tags.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Est: {task.estimationMin} min</span>
            {due ? <span>Due: {due}</span> : <span>Sin fecha</span>}
          </div>

          {/* ✅ BLOQUE MODO DIOS */}
          {godMode && (
            <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">Modo Dios</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEvaluate?.(task.id)}
                  aria-label={`Evaluar tarea ${task.title}`}
                >
                  Evaluar
                </Button>
              </div>

              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Rúbrica:</span>{" "}
                {hasScore ? `${task.rubricScore}/10` : "Sin evaluar"}
              </div>

              {hasComment ? (
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Comentario:</span>{" "}
                  {task.rubricComment}
                </div>
              ) : null}

              {hasNotes ? (
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Observaciones:</span>{" "}
                  {task.javiNotes}
                </div>
              ) : null}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(task)}
              aria-label={`Editar tarea ${task.title}`}
            >
              Editar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDelete(task)}
              aria-label={`Eliminar tarea ${task.title}`}
            >
              Borrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
