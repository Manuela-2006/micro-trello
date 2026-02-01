"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { BoardState, ColumnId, Task } from "@/types";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";

type Props = {
  columnId: ColumnId;
  title: string;
  state: BoardState;
  visibleIds?: string[];
  dragDisabled: boolean;
  onCreate: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;

  // ✅ FASE 10
  godMode: boolean;
  onEvaluate?: (taskId: string) => void;
};

export function Column({
  columnId,
  title,
  state,
  visibleIds,
  dragDisabled,
  onCreate,
  onEdit,
  onDelete,
  godMode,
  onEvaluate,
}: Props) {
  const ids = visibleIds ?? state.columns[columnId];
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const tasks = ids
    .map((id) => state.tasks[id])
    .filter((task): task is Task => Boolean(task));

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-sm text-muted-foreground">{tasks.length}</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onCreate}
          aria-label={`Crear tarea en ${title}`}
        >
          +
        </Button>
      </div>

      {dragDisabled && (
        <div className="mt-2 text-xs text-muted-foreground">
          Drag & drop desactivado durante la búsqueda.
        </div>
      )}

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={`mt-4 space-y-3 ${isOver ? "bg-muted/30" : ""}`}>
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No hay tareas que coincidan aquí.
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                dragDisabled={dragDisabled}
                onEdit={onEdit}
                onDelete={onDelete}
                godMode={godMode}
                onEvaluate={onEvaluate}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
