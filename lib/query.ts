import type { SearchQuery, Task, Priority, EstOp, DueFilter } from "@/types";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function isPriority(x: string): x is Priority {
  return x === "low" || x === "medium" || x === "high";
}

function parseDue(x: string): DueFilter | undefined {
  if (x === "overdue") return "overdue";
  if (x === "week") return "week";
  if (x === "any") return "any";
  return undefined;
}

function parseEst(raw: string): { op: EstOp; value: number } | null {
  // soporta: est:<60 | est:>=120 | est:=30
  const m = raw.match(/^(<=|>=|<|>|=)\s*(\d+)$/);
  if (m) {
    const op = m[1] as EstOp;
    const value = Number(m[2]);
    if (!Number.isFinite(value)) return null;
    return { op, value };
  }

  // soporta: est:30 (equivale a est:=30)
  if (/^\d+$/.test(raw.trim())) {
    const value = Number(raw.trim());
    if (!Number.isFinite(value)) return null;
    return { op: "=", value };
  }

  return null;
}

/**
 * parseQuery:
 * - texto libre: "revisar cliente"
 * - operadores: tag:react p:high due:overdue due:week est:<60 est:>=120
 */
export function parseQuery(input: string): SearchQuery {
  const raw = input ?? "";
  const tokens = raw.split(/\s+/).filter(Boolean);

  const q: SearchQuery = { text: "" };
  const free: string[] = [];

  for (const token of tokens) {
    const t = token.trim();
    const idx = t.indexOf(":");

    if (idx === -1) {
      free.push(t);
      continue;
    }

    const key = normalize(t.slice(0, idx));
    const valueRaw = t.slice(idx + 1);
    const value = normalize(valueRaw);

    if (!value) continue;

    if (key === "tag") {
      q.tag = value;
      continue;
    }

    if (key === "p" || key === "priority") {
      if (isPriority(value)) q.priority = value;
      else free.push(t); // si no es válido, lo tratamos como texto
      continue;
    }

    if (key === "due") {
      const due = parseDue(value);
      if (due) q.due = due;
      else free.push(t);
      continue;
    }

    if (key === "est") {
      const est = parseEst(valueRaw.trim());
      if (est) q.est = est;
      else free.push(t);
      continue;
    }

    // operador desconocido -> texto libre
    free.push(t);
  }

  q.text = free.join(" ").trim();
  return q;
}

function textMatches(task: Task, queryText: string): boolean {
  const qt = normalize(queryText);
  if (!qt) return true;

  const dueISO = task.dueAtISO ?? "";
  const createdISO = task.createdAtISO ?? "";
  const dueDate = dueISO ? new Date(dueISO) : null;
  const createdDate = createdISO ? new Date(createdISO) : null;
  const dueDateStr =
    dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toLocaleDateString() : "";
  const createdDateStr =
    createdDate && !Number.isNaN(createdDate.getTime())
      ? createdDate.toLocaleDateString()
      : "";
  const dueShort = dueISO ? dueISO.slice(0, 10) : "";
  const createdShort = createdISO.slice(0, 10);
  const noDue = dueISO ? "" : "sin fecha";

  const noNotes =
    (!task.javiNotes || task.javiNotes.trim() === "") &&
    (!task.rubricComment || task.rubricComment.trim() === "")
      ? "sin observaciones"
      : "";

  const hay = normalize(
    [
      task.title,
      task.description ?? "",
      task.priority,
      task.status,
      task.tags.join(" "),
      String(task.estimationMin),
      dueISO,
      dueShort,
      dueDateStr,
      createdISO,
      createdShort,
      createdDateStr,
      noDue,
      task.javiNotes ?? "",
      task.rubricComment ?? "",
      task.rubricScore !== undefined ? String(task.rubricScore) : "",
      task.rubricScore !== undefined ? `score ${task.rubricScore}` : "",
      task.rubricScore !== undefined ? `rubrica ${task.rubricScore}` : "",
      task.rubricScore !== undefined ? `${task.rubricScore}/10` : "",
      noNotes,
    ].join(" ")
  );
  const words = qt.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  return words.every((w) => hay.includes(w));
}

function tagMatches(task: Task, tag?: string): boolean {
  if (!tag) return true;
  const wanted = normalize(tag);
  return task.tags.some((t) => normalize(t) === wanted);
}

function priorityMatches(task: Task, p?: Priority): boolean {
  if (!p) return true;
  return task.priority === p;
}

function dueMatches(task: Task, due?: DueFilter): boolean {
  if (!due || due === "any") return true;

  const iso = task.dueAtISO;
  if (!iso) return false;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();

  if (due === "overdue") {
    return d.getTime() < now.getTime();
  }

  if (due === "week") {
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d.getTime() >= now.getTime() && d.getTime() <= in7.getTime();
  }

  return true;
}

function estMatches(task: Task, est?: { op: EstOp; value: number }): boolean {
  if (!est) return true;

  const v = task.estimationMin;
  const n = est.value;

  if (est.op === "<") return v < n;
  if (est.op === "<=") return v <= n;
  if (est.op === ">") return v > n;
  if (est.op === ">=") return v >= n;
  return v === n;
}

/**
 * matchesQuery: decide si una tarea cumple la query parseada.
 */
export function matchesQuery(task: Task, q: SearchQuery): boolean {
  return (
    textMatches(task, q.text) &&
    tagMatches(task, q.tag) &&
    priorityMatches(task, q.priority) &&
    dueMatches(task, q.due) &&
    estMatches(task, q.est)
  );
}

/**
 * buildFilteredState:
 * Mantiene el estado original (tasks/audit/godMode) pero filtra los IDs por columna.
 */
export function buildFilteredState(
  state: import("@/types").BoardState,
  q: SearchQuery
): import("@/types").BoardState {
  const nextColumns = {
    todo: [] as string[],
    doing: [] as string[],
    done: [] as string[],
  };

  for (const col of ["todo", "doing", "done"] as const) {
    const ids = state.columns[col];
    nextColumns[col] = ids.filter((id) => {
      const t = state.tasks[id];
      if (!t) return false;
      return matchesQuery(t, q);
    });
  }

  return {
    ...state,
    columns: nextColumns,
  };
}

