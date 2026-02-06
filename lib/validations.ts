import { z } from "zod";

// ====== ESQUEMAS BASE ======
const ColumnIdSchema = z.enum(["todo", "doing", "done"]);
const PrioritySchema = z.enum(["low", "medium", "high"]);
const AuditActionSchema = z.enum(["CREATE", "UPDATE", "DELETE", "MOVE"]);
const UUIDSchema = z.string().uuid();
const ISODateTimeSchema = z.string().datetime();

// ====== ESQUEMA PARA TAREAS (MODELO COMPLETO) ======
export const TaskSchema = z.object({
  id: UUIDSchema,
  title: z.string().min(3, "El tÍtulo debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  priority: PrioritySchema,
  tags: z.array(z.string()).default([]),
  estimationMin: z.number().int().nonnegative(),
  createdAtISO: ISODateTimeSchema,
  dueAtISO: ISODateTimeSchema.optional(),
  status: ColumnIdSchema,
  // Modo Dios
  javiNotes: z.string().optional(),
  rubricScore: z.number().min(0).max(10).optional(),
  rubricComment: z.string().optional(),
});

// ====== ESQUEMA PARA AUDITORÍA ======
export const AuditDiffSchema = z
  .object({
    before: TaskSchema.partial().optional(),
    after: TaskSchema.partial().optional(),
    changedKeys: z.array(z.string()).optional(),
  })
  .optional();

export const AuditEventSchema = z.object({
  id: UUIDSchema,
  timestampISO: ISODateTimeSchema,
  action: AuditActionSchema,
  taskId: UUIDSchema,
  diff: AuditDiffSchema,
  userLabel: z.literal("Alumno/a"),
});

// ====== ESQUEMA PARA BOARD STATE ======
export const BoardStateSchema = z.object({
  version: z.literal(1),
  tasks: z.record(z.string(), TaskSchema),
  columns: z.object({
    todo: z.array(z.string()),
    doing: z.array(z.string()),
    done: z.array(z.string()),
  }),
  audit: z.array(AuditEventSchema),
  godMode: z.boolean(),
});

export type BoardStateInput = z.infer<typeof BoardStateSchema>;

// ====== ESQUEMA PARA FORMULARIO DE TAREAS ======
// Simplificado para evitar problemas con react-hook-form
export const taskFormSchema = z.object({
  title: z.string().min(3, "El tÍtulo debe tener al menos 3 caracteres"),
  description: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  tagsText: z.string(),
  estimationMin: z.number().int().positive("Debe ser mayor que 0"),
  dueDate: z.string(),
});

export type TaskFormValues = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  tagsText: string;
  estimationMin: number;
  dueDate: string;
};
