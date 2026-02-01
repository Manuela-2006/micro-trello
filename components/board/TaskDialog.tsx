"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ColumnId, Priority, Task } from "@/types";
import { taskFormSchema, type TaskFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  columnId: ColumnId;
  task?: Task;
  onSubmitTask: (task: Task) => void;
};

function priorityLabel(p: Priority): string {
  if (p === "high") return "High";
  if (p === "medium") return "Medium";
  return "Low";
}

function tagsTextFromArray(tags: string[]): string {
  return tags.join(", ");
}

function parseTags(text?: string): string[] {
  if (!text) return [];
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function dateToISO(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function isoToDateInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function TaskDialog({
  open,
  onOpenChange,
  mode,
  columnId,
  task,
  onSubmitTask,
}: Props) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      tagsText: "",
      estimationMin: 30,
      dueDate: "",
    },
  });

  useEffect(() => {
    if (mode !== "edit" || !task) return;
    form.reset({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      tagsText: tagsTextFromArray(task.tags),
      estimationMin: task.estimationMin,
      dueDate: isoToDateInput(task.dueAtISO),
    });
  }, [mode, task, form]);

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      form.reset({
        title: "",
        description: "",
        priority: "medium",
        tagsText: "",
        estimationMin: 30,
        dueDate: "",
      });
    }
  }, [open, mode, form]);

  function submit(values: TaskFormValues) {
    const nowISO = new Date().toISOString();
    const tags = parseTags(values.tagsText);

    if (mode === "create") {
      const newTask: Task = {
        id: uuidv4(),
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        priority: values.priority,
        tags,
        estimationMin: values.estimationMin,
        createdAtISO: nowISO,
        dueAtISO: dateToISO(values.dueDate),
        status: columnId,
      };
      onSubmitTask(newTask);
      onOpenChange(false);
      return;
    }

    if (mode === "edit" && task) {
      const updated: Task = {
        ...task,
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        priority: values.priority,
        tags,
        estimationMin: values.estimationMin,
        dueAtISO: dateToISO(values.dueDate),
      };
      onSubmitTask(updated);
      onOpenChange(false);
    }
  }

  const title = mode === "create" ? "Nueva tarea" : "Editar tarea";
  const desc =
    mode === "create"
      ? "Crea una tarea con datos realistas. Se guardará en la columna actual."
      : "Modifica los campos y guarda los cambios.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="task-dialog-description">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="task-dialog-description">{desc}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ej: Revisar compliance Q2" 
                      autoFocus 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Opcional..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["low", "medium", "high"] as Priority[]).map((p) => (
                          <SelectItem key={p} value={p}>
                            {priorityLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimationMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimación (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                          field.onChange(val);
                        }}
                        min={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tagsText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: compliance, urgent, quarterly" />
                  </FormControl>
                  <FormDescription>Separadas por comas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha límite</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}