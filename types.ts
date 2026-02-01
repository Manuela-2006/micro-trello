// ============================================
// TIPOS BASE
// ============================================

/**
 * Identificador de columna del Kanban
 */
export type ColumnId = "todo" | "doing" | "done";

/**
 * Nivel de prioridad de una tarea
 */
export type Priority = "low" | "medium" | "high";

/**
 * Tipo de acción de auditoría
 */
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "MOVE" | "IMPORT_FIX";

// ============================================
// TASK (modelo principal)
// ============================================

/**
 * Representa una tarea del sistema Kanban
 * Incluye campos principales + campos del Modo Dios
 */
export type Task = {
  // Campos obligatorios
  id: string; // UUID generado con uuid v4
  title: string; // Mínimo 3 caracteres
  description?: string; // Opcional
  priority: Priority;
  tags: string[]; // Array de strings (ej: ["compliance", "urgent"])
  estimationMin: number; // Estimación en minutos
  createdAtISO: string; // Fecha de creación en formato ISO
  dueAtISO?: string; // Fecha límite opcional en formato ISO
  status: ColumnId; // Columna actual de la tarea

  // Campos del Modo Dios (opcionales, persisten aunque modo esté off)
  javiNotes?: string; // Observaciones del evaluador
  rubricScore?: number; // Puntuación 0-10
  rubricComment?: string; // Comentario de la evaluación
};

// ============================================
// AUDITORÍA
// ============================================

/**
 * Representa las diferencias entre dos estados de una tarea
 * Solo incluye los campos que cambiaron
 */
export type AuditDiff = {
  before?: Partial<Task>; // Estado anterior (solo campos modificados)
  after?: Partial<Task>; // Estado posterior (solo campos modificados)
  changedKeys?: (keyof Task)[]; // Lista de claves que cambiaron
};

/**
 * Evento de auditoría que registra toda operación sobre tareas
 */
export type AuditEvent = {
  id: string; // UUID del evento
  timestampISO: string; // Momento exacto de la operación
  action: AuditAction; // Tipo de operación
  taskId: string; // ID de la tarea afectada
  diff: AuditDiff; // Diferencias antes/después
  userLabel: "Alumno/a"; // Identificador fijo del usuario
};

// ============================================
// ESTADO GLOBAL
// ============================================

/**
 * Estructura completa del estado de la aplicación
 * Se persiste en localStorage como un único objeto
 */
export type BoardState = {
  version: 1; // Para futuras migraciones de esquema
  tasks: Record<string, Task>; // Tareas normalizadas por ID
  columns: Record<ColumnId, string[]>; // IDs ordenados por columna
  audit: AuditEvent[]; // Historial completo de auditoría
  godMode: boolean; // Estado del switch Modo Dios
};

// ============================================
// BÚSQUEDA AVANZADA
// ============================================

/**
 * Filtro de fecha límite
 */
export type DueFilter = "overdue" | "week" | "any";

/**
 * Operador de comparación para estimación
 */
export type EstOp = "<" | "<=" | ">" | ">=" | "=";

/**
 * Query parseada para búsqueda avanzada
 * Se construye a partir del string de búsqueda del usuario
 */
export type SearchQuery = {
  text: string; // Texto libre (busca en title y description)
  tag?: string; // Filtro por tag específico
  priority?: Priority; // Filtro por prioridad
  due?: DueFilter; // Filtro por fecha límite
  est?: { op: EstOp; value: number }; // Filtro por estimación con operador
};
