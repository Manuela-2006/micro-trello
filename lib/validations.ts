import { z } from "zod";
import { Priority } from "@/types";

export const taskFormSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"] satisfies readonly Priority[]),
  tagsText: z.string().optional(), // lo guardamos como texto y lo convertimos a string[]
  estimationMin: z.coerce
  .number()
  .refine((n) => Number.isFinite(n), "La estimación debe ser un número")
  .int("La estimación debe ser un número entero")
  .positive("La estimación debe ser mayor que 0"),
  dueDate: z.string().optional(), // "YYYY-MM-DD" o vacío
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
