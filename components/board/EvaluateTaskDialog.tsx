"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSubmit: (taskId: string, evaluation: {
    rubricScore: number;
    rubricComment: string;
    javiNotes: string;
  }) => void;
};

export function EvaluateTaskDialog({ open, onOpenChange, task, onSubmit }: Props) {
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (task) {
      setScore(task.rubricScore?.toString() ?? "");
      setComment(task.rubricComment ?? "");
      setNotes(task.javiNotes ?? "");
    } else {
      setScore("");
      setComment("");
      setNotes("");
    }
  }, [task]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      alert("La rúbrica debe ser un número entre 0 y 10");
      return;
    }

    onSubmit(task.id, {
      rubricScore: numScore,
      rubricComment: comment.trim(),
      javiNotes: notes.trim(),
    });

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Evaluar tarea</DialogTitle>
          <DialogDescription>
            {task ? task.title : "Sin tarea"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="score">Rúbrica (0-10) *</Label>
            <Input
              id="score"
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="ej: 8.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentario de evaluación</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentarios sobre la calidad, ejecución, etc."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones de Javi</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales, feedback, etc."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Guardar evaluación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}