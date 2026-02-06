import { AuditAction, AuditDiff, AuditEvent, BoardState, Task } from "@/types";
import { v4 as uuidv4 } from "uuid";

const USER_LABEL: AuditEvent["userLabel"] = "Alumno/a";

/**
 * Asignación tipada para evitar errores de indexado con keyof Task
 * y mantener 0 `any`.
 */
function setPatch<K extends keyof Task>(
  patch: Partial<Task>,
  key: K,
  value: Task[K]
) {
  patch[key] = value;
}

/**
 * Calcula un diff parcial: solo campos que cambian.
 * - before/after contienen únicamente esos campos
 * - changedKeys lista las claves cambiadas
 */
export function buildTaskDiff(before?: Task, after?: Task): AuditDiff {
  const changedKeys: (keyof Task)[] = [];
  const beforePatch: Partial<Task> = {};
  const afterPatch: Partial<Task> = {};

  // CREATE: no hay before → diff solo "after"
  if (!before && after) {
    const keys = Object.keys(after) as (keyof Task)[];
    for (const k of keys) {
      setPatch(afterPatch, k, after[k]);
      changedKeys.push(k);
    }
    return { after: afterPatch, changedKeys };
  }

  // DELETE: no hay after → diff solo "before"
  if (before && !after) {
    const keys = Object.keys(before) as (keyof Task)[];
    for (const k of keys) {
      setPatch(beforePatch, k, before[k]);
      changedKeys.push(k);
    }
    return { before: beforePatch, changedKeys };
  }

  if (!before || !after) return {};

  // Comparación campo a campo (shallow)
  const keys = new Set<keyof Task>([
    ...(Object.keys(before) as (keyof Task)[]),
    ...(Object.keys(after) as (keyof Task)[]),
  ]);

  for (const k of keys) {
    const b = before[k];
    const a = after[k];

    const isEqual =
      Array.isArray(b) && Array.isArray(a)
        ? b.length === a.length && b.every((x, i) => x === a[i])
        : b === a;

    if (!isEqual) {
      changedKeys.push(k);

      // b y a tienen tipo Task[keyof Task] (unión),
      // los afinamos a Task[K] para setPatch
      setPatch(beforePatch, k, b as Task[typeof k]);
      setPatch(afterPatch, k, a as Task[typeof k]);
    }
  }

  return {
    before: Object.keys(beforePatch).length ? beforePatch : undefined,
    after: Object.keys(afterPatch).length ? afterPatch : undefined,
    changedKeys: changedKeys.length ? changedKeys : undefined,
  };
}

/**
 * Crea un evento de auditorÍa.
 */
export function createAuditEvent(params: {
  action: AuditAction;
  taskId: string;
  diff: AuditDiff;
}): AuditEvent {
  return {
    id: uuidv4(),
    timestampISO: new Date().toISOString(),
    action: params.action,
    taskId: params.taskId,
    diff: params.diff,
    userLabel: USER_LABEL,
  };
}

/**
 * Añade un evento al estado (inmutable).
 */
export function appendAudit(state: BoardState, event: AuditEvent): BoardState {
  return {
    ...state,
    audit: [event, ...state.audit], // newest first (más útil para UI)
  };
}

/**
 * Helper de alto nivel: calcula diff y lo añade al estado.
 */
export function addAuditForTaskChange(params: {
  state: BoardState;
  action: AuditAction;
  taskId: string;
  before?: Task;
  after?: Task;
}): BoardState {
  const diff = buildTaskDiff(params.before, params.after);
  const event = createAuditEvent({
    action: params.action,
    taskId: params.taskId,
    diff,
  });
  return appendAudit(params.state, event);
}

