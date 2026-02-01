// src/types.ts

export type ColumnId = "todo" | "doing" | "done";
export type Priority = "low" | "medium" | "high";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "MOVE";

export type Task = {
  id: string; // uuid
  title: string; // min 3
  description?: string;
  priority: Priority;
  tags: string[];
  estimationMin: number;
  createdAtISO: string;
  dueAtISO?: string;
  status: ColumnId;

  // ====== MODO DIOS (opcionales) ======
  javiNotes?: string; // “Observaciones de Javi”
  javiScore?: number; // 0–10
  javiComment?: string;
};

export type AuditDiff = {
  before?: Partial<Task>;
  after?: Partial<Task>;
  changedKeys?: (keyof Task)[];
};

export type AuditEvent = {
  id: string; // uuid del evento
  timestampISO: string;
  action: AuditAction;
  taskId: string;
  diff?: AuditDiff;
  userLabel: "Alumno/a";
};

export type BoardColumns = {
  todo: string[];
  doing: string[];
  done: string[];
};

export type BoardState = {
  version: 1;
  tasks: Record<string, Task>;
  columns: BoardColumns;
  audit: AuditEvent[];
  godMode: boolean;
};
