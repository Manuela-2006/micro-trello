// src/lib/transfer.ts

import type { BoardState, Task, AuditEvent } from "@/types";
import { BoardStateSchema } from "@/lib/validation";
import { v4 as uuidv4 } from "uuid";

const EXPORT_FILENAME = "micro-trello-board.json";

// ========== EXPORT ==========

export function exportBoardState(state: BoardState) {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = EXPORT_FILENAME;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

// ========== IMPORT (parse + validate + fix) ==========

export async function importBoardStateFromFile(file: File): Promise<BoardState> {
  const text = await file.text();

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("El archivo no es JSON válido.");
  }

  const parsed = BoardStateSchema.safeParse(raw);
  if (!parsed.success) {
    // Mostrar TODOS los errores (no solo el primero)
    const issues = parsed.error.issues
      .map((i) => {
        const where = i.path?.length ? i.path.join(".") : "raíz";
        return `- ${where}: ${i.message}`;
      })
      .join("\n");

    throw new Error(`JSON inválido:\n${issues}`);
  }

  const normalized = parsed.data as BoardState;

  // Puede venir con IDs duplicados o columnas inconsistentes aunque pase schema
  const { state: fixed, fixes } = resolveIdConflictsAndClean(normalized);

  // Registrar arreglos como UPDATE (acción permitida)
  if (fixes.remappedTasks.length > 0) {
    const fixEvents: AuditEvent[] = fixes.remappedTasks.map(({ from, to }) => ({
      id: uuidv4(),
      timestampISO: new Date().toISOString(),
      action: "UPDATE",
      taskId: to,
      diff: {
        before: { id: from } as Partial<Task>,
        after: { id: to } as Partial<Task>,
        changedKeys: ["id"],
      },
      userLabel: "Alumno/a",
    }));

    return {
      ...fixed,
      audit: [...fixEvents, ...fixed.audit],
    };
  }

  return fixed;
}

// ========== FIXES ==========

function resolveIdConflictsAndClean(input: BoardState): {
  state: BoardState;
  fixes: { remappedTasks: Array<{ from: string; to: string }> };
} {
  const remapTaskId = new Map<string, string>(); // old -> new
  const remappedTasks: Array<{ from: string; to: string }> = [];

  // 1) Asegurar que keys de tasks coinciden con task.id y que no hay duplicados
  const usedTaskIds = new Set<string>();
  const nextTasks: Record<string, Task> = {};

  for (const [key, task] of Object.entries(input.tasks)) {
    const effectiveId = task.id || key;
    let finalId = effectiveId;

    // Si el id ya existe o la key no coincide, generamos uno nuevo
    if (usedTaskIds.has(finalId) || key !== effectiveId) {
      const newId = uuidv4();
      finalId = newId;

      // Remapeamos tanto la key como el id “efectivo”
      remapTaskId.set(effectiveId, newId);
      remapTaskId.set(key, newId);

      remappedTasks.push({ from: effectiveId, to: newId });
    }

    usedTaskIds.add(finalId);
    nextTasks[finalId] = { ...task, id: finalId };
  }

  // 2) Reescribir columnas con el remap + limpiar IDs inexistentes + quitar duplicados por columna
  const nextColumns: BoardState["columns"] = {
    todo: [],
    doing: [],
    done: [],
  };

  (["todo", "doing", "done"] as const).forEach((col) => {
    const seen = new Set<string>();
    const original = input.columns?.[col] ?? [];

    for (const id of original) {
      const mapped = remapTaskId.get(id) ?? id;
      if (!nextTasks[mapped]) continue;
      if (seen.has(mapped)) continue;
      seen.add(mapped);
      nextColumns[col].push(mapped);
    }
  });

  // 2.1) Meter en "todo" las tareas que no están en ninguna columna (evita “tareas huérfanas”)
  const inBoard = new Set<string>([
    ...nextColumns.todo,
    ...nextColumns.doing,
    ...nextColumns.done,
  ]);

  for (const id of Object.keys(nextTasks)) {
    if (!inBoard.has(id)) {
      nextColumns.todo.push(id);
      inBoard.add(id);
    }
  }

  // 3) Garantizar consistencia status de cada task con la columna donde está
  const statusById = new Map<string, Task["status"]>();
  (["todo", "doing", "done"] as const).forEach((col) => {
    for (const id of nextColumns[col]) statusById.set(id, col);
  });

  const finalTasks: Record<string, Task> = {};
  for (const [id, task] of Object.entries(nextTasks)) {
    const realStatus = statusById.get(id);
    finalTasks[id] = realStatus ? { ...task, status: realStatus } : task;
  }

  // 4) Reescribir audit:
  // - Remap de event.taskId si hace falta
  // - Asegurar IDs únicos de eventos
  const usedEventIds = new Set<string>();
  const nextAudit: AuditEvent[] = (input.audit ?? []).map((ev) => {
    const newTaskId = remapTaskId.get(ev.taskId) ?? ev.taskId;

    let newEventId = ev.id;
    if (!newEventId || usedEventIds.has(newEventId)) newEventId = uuidv4();
    usedEventIds.add(newEventId);

    return {
      ...ev,
      id: newEventId,
      taskId: newTaskId,
    };
  });

  const out: BoardState = {
    version: 1,
    tasks: finalTasks,
    columns: nextColumns,
    audit: nextAudit,
    godMode: !!input.godMode,
  };

  return {
    state: out,
    fixes: { remappedTasks },
  };
}
