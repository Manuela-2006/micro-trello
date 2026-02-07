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
};

function priorityLabel(p: Task["priority"]) {
  if (p === "high") return "High";
  if (p === "medium") return "Medium";
  return "Low";
}

function priorityBadgeClass(p: Task["priority"]) {
  if (p === "high") return "bg-teal-700 text-white";
  if (p === "medium") return "bg-[#80CBC4] text-teal-950";
  return "bg-[#E0F2F1] text-teal-950";
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
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: dragDisabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const due = formatDate(task.dueAtISO);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="rounded-md hover:bg-muted/40 transition-colors">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex items-start gap-2">
              {/* Drag handle: listeners solo en el handle */}
              <div className="relative group">
                <button
                  type="button"
                  className="mt-0.5 cursor-grab rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Arrastrar tarea con teclado"
                  disabled={dragDisabled}
                  {...listeners}
                >
                  ::
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute -top-8 left-0 rounded bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  Mover tarea de columna
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="font-medium leading-5 truncate">{task.title}</h3>
                {task.description ? (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                ) : null}
              </div>
            </div>

            <Badge className={priorityBadgeClass(task.priority)}>
              {priorityLabel(task.priority)}
            </Badge>
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
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(task)}
              aria-label={`Editar tarea: ${task.title}`}
            >
              Editar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDelete(task)}
              aria-label={`Eliminar tarea: ${task.title}`}
            >
              Borrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


