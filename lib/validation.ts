import { z } from "zod";

const ColumnIdSchema = z.enum(["todo", "doing", "done"]);
const PrioritySchema = z.enum(["low", "medium", "high"]);

// ✅ SOLO lo que pide el profesor
const AuditActionSchema = z.enum(["CREATE", "UPDATE", "DELETE", "MOVE"]);

// Si quieres ser más estricto con UUID:
const UUIDSchema = z.string().uuid();

// ISO datetime (ej: 2026-01-31T18:20:07.406Z)
const ISODateTimeSchema = z.string().datetime();

export const TaskSchema = z.object({
  id: UUIDSchema,
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),

  priority: PrioritySchema,
  tags: z.array(z.string()).default([]),

  estimationMin: z.number().int().nonnegative(),

  createdAtISO: ISODateTimeSchema,
  dueAtISO: ISODateTimeSchema.optional(),

  status: ColumnIdSchema,

  // ====== MODO DIOS (nombres consistentes) ======
  javiNotes: z.string().optional(),
  rubricScore: z.number().min(0).max(10).optional(),
  rubricComment: z.string().optional(),
});

export const AuditDiffSchema = z
  .object({
    before: TaskSchema.partial().optional(),
    after: TaskSchema.partial().optional(),
    changedKeys: z.array(z.string()).optional(),
  })
  .optional(); // ✅ más robusto: permite eventos sin diff si los tienes antiguos

export const AuditEventSchema = z.object({
  id: UUIDSchema,
  timestampISO: ISODateTimeSchema,
  action: AuditActionSchema,
  taskId: UUIDSchema,

  diff: AuditDiffSchema, // ahora puede faltar sin romper import
  userLabel: z.literal("Alumno/a"),
});

export const BoardStateSchema = z.object({
  version: z.literal(1),

  // OJO: la key puede NO ser uuid si alguien exporta raro.
  // PERO tú en import ya lo normalizas. Aquí puedes permitir string general.
  // Si quieres ser MUY estricto, pon UUIDSchema en la key y ya.
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
