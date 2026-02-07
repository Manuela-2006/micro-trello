"use client";

import { useState } from "react";
import type { BoardState, ColumnId, Task } from "@/types";
import { Column } from "@/components/board/Column";
import { TaskDialog } from "@/components/board/TaskDialog";
import { DeleteTaskDialog } from "@/components/board/DeleteTaskDialog";
import { EvaluateTaskDialog } from "@/components/board/EvaluateTaskDialog";
import { addAuditForTaskChange } from "@/lib/audit";
import { Button } from "@/components/ui/button";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

type Props = {
  state: BoardState;
  setState: (next: BoardState) => void;
  visibleColumns?: Record<ColumnId, string[]>;
  dragDisabled?: boolean;
};

const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: "todo", title: "Todo" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" },
];

export function Board({ state, setState, visibleColumns, dragDisabled }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogColumn, setDialogColumn] = useState<ColumnId>("todo");
  const [dialogTask, setDialogTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  
  // ✅ FASE 10: Estado para evaluar tareas
  const [evaluateTask, setEvaluateTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function isColumnId(value: string): value is ColumnId {
    return value === "todo" || value === "doing" || value === "done";
  }

  function findColumnForTask(taskId: string): ColumnId | null {
    for (const col of Object.keys(state.columns) as ColumnId[]) {
      if (state.columns[col].includes(taskId)) return col;
    }
    return null;
  }

  function openCreate(col: ColumnId) {
    setDialogMode("create");
    setDialogColumn(col);
    setDialogTask(null);
    setDialogOpen(true);
  }

  function handleCreate(task: Task) {
    const nextBase: BoardState = {
      ...state,
      tasks: { ...state.tasks, [task.id]: task },
      columns: {
        ...state.columns,
        [task.status]: [task.id, ...state.columns[task.status]],
      },
    };
    const next = addAuditForTaskChange({
      state: nextBase,
      action: "CREATE",
      taskId: task.id,
      before: undefined,
      after: task,
    });
    setState(next);
    setDialogOpen(false);
    setDialogTask(null);
  }

  function handleUpdate(task: Task) {
    const prev = state.tasks[task.id];
    if (!prev) return;
    const nextBase: BoardState = {
      ...state,
      tasks: { ...state.tasks, [task.id]: task },
    };
    const next = addAuditForTaskChange({
      state: nextBase,
      action: "UPDATE",
      taskId: task.id,
      before: prev,
      after: task,
    });
    setState(next);
    setDialogOpen(false);
    setDialogTask(null);
  }

  function handleDelete(taskId: string) {
    const prev = state.tasks[taskId];
    if (!prev) return;
    const { [taskId]: _removed, ...rest } = state.tasks;
    const nextBase: BoardState = {
      ...state,
      tasks: rest,
      columns: {
        ...state.columns,
        [prev.status]: state.columns[prev.status].filter((id) => id !== taskId),
      },
    };
    const next = addAuditForTaskChange({
      state: nextBase,
      action: "DELETE",
      taskId,
      before: prev,
      after: undefined,
    });
    setState(next);
  }

  // ✅ FASE 10: Handler para evaluar tareas
  function handleEvaluate(
    taskId: string,
    evaluation: {
      rubricScore: number;
      rubricComment: string;
      javiNotes: string;
    }
  ) {
    const prev = state.tasks[taskId];
    if (!prev) return;

    const updated: Task = {
      ...prev,
      rubricScore: evaluation.rubricScore,
      rubricComment: evaluation.rubricComment || undefined,
      javiNotes: evaluation.javiNotes || undefined,
    };

    const nextBase: BoardState = {
      ...state,
      tasks: { ...state.tasks, [taskId]: updated },
    };

    const next = addAuditForTaskChange({
      state: nextBase,
      action: "UPDATE",
      taskId,
      before: prev,
      after: updated,
    });

    setState(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (dragDisabled) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromCol = findColumnForTask(activeId);
    if (!fromCol) return;

    let toCol: ColumnId | null = null;
    if (isColumnId(overId)) {
      toCol = overId;
    } else {
      toCol = findColumnForTask(overId);
    }
    if (!toCol) return;

    const fromIds = state.columns[fromCol];
    const toIds = state.columns[toCol];
    const activeIndex = fromIds.indexOf(activeId);
    if (activeIndex === -1) return;

    // Reordenar dentro de la misma columna
    if (fromCol === toCol) {
      if (isColumnId(overId)) return;
      const overIndex = toIds.indexOf(overId);
      if (overIndex === -1) return;
      const reordered = arrayMove(toIds, activeIndex, overIndex);
      setState({
        ...state,
        columns: { ...state.columns, [toCol]: reordered },
      });
      return;
    }

    // Mover entre columnas
    const prevTask = state.tasks[activeId];
    if (!prevTask) return;

    const nextFrom = fromIds.filter((id) => id !== activeId);
    let insertIndex = toIds.length;
    if (!isColumnId(overId)) {
      const overIndex = toIds.indexOf(overId);
      if (overIndex !== -1) insertIndex = overIndex;
    }

    const nextTo = [
      ...toIds.slice(0, insertIndex),
      activeId,
      ...toIds.slice(insertIndex),
    ];

    const updatedTask: Task = { ...prevTask, status: toCol };
    let nextBase: BoardState = {
      ...state,
      tasks: { ...state.tasks, [activeId]: updatedTask },
      columns: {
        ...state.columns,
        [fromCol]: nextFrom,
        [toCol]: nextTo,
      },
    };

    nextBase = addAuditForTaskChange({
      state: nextBase,
      action: "MOVE",
      taskId: activeId,
      before: prevTask,
      after: updatedTask,
    });

    setState(nextBase);
  }

  const observationTasks = Object.values(state.tasks);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <section className={`grid gap-4 ${state.godMode ? "grid-cols-4" : "grid-cols-3"}`}>
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              columnId={col.id}
              title={col.title}
              state={state}
              visibleIds={visibleColumns?.[col.id]}
              dragDisabled={Boolean(dragDisabled)}
              onCreate={() => openCreate(col.id)}
              onEdit={(task) => {
                setDialogMode("edit");
                setDialogColumn(task.status);
                setDialogTask(task);
                setDialogOpen(true);
              }}
              onDelete={(task) => setDeleteTask(task)}
            />
          ))}

          {state.godMode && (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Observaciones</h2>
                  <span className="text-sm text-muted-foreground">
                    {observationTasks.length}
                  </span>
                </div>
              </div>

              <div className="mt-4 divide-y divide-border/60">
                {observationTasks.length === 0 ? (
                  <div className="border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No hay tareas para evaluar.
                  </div>
                ) : (
                  observationTasks.map((task) => {
                    const hasScore = typeof task.rubricScore === "number";
                    const comment = task.rubricComment?.trim();
                    return (
                      <div key={task.id} className="py-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Score: {hasScore ? `${task.rubricScore}/10` : "—"}
                            </p>
                          </div>
                          <span className="text-xs border rounded-md px-2 py-0.5">
                            {hasScore ? "Evaluada" : "Sin evaluar"}
                          </span>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {comment ? comment : "Sin observaciones"}
                        </div>

                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-md"
                            onClick={() => setEvaluateTask(task)}
                          >
                            {hasScore ? "Editar" : "Evaluar"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </section>
      </DndContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setDialogTask(null);
        }}
        mode={dialogMode}
        columnId={dialogMode === "edit" ? dialogTask?.status ?? dialogColumn : dialogColumn}
        task={dialogMode === "edit" ? dialogTask ?? undefined : undefined}
        onSubmitTask={dialogMode === "edit" ? handleUpdate : handleCreate}
      />

      <DeleteTaskDialog
        open={Boolean(deleteTask)}
        onOpenChange={(open) => {
          if (!open) setDeleteTask(null);
        }}
        taskTitle={deleteTask?.title ?? ""}
        onConfirm={() => {
          if (!deleteTask) return;
          const id = deleteTask.id;
          setDeleteTask(null);
          handleDelete(id);
        }}
      />

      {/* ✅ FASE 10: Dialog de evaluación */}
      <EvaluateTaskDialog
        open={Boolean(evaluateTask)}
        onOpenChange={(open) => {
          if (!open) setEvaluateTask(null);
        }}
        task={evaluateTask}
        onSubmit={handleEvaluate}
      />
    </>
  );
}

