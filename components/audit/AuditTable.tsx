"use client";

import * as React from "react";
import type { AuditAction, AuditEvent } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CopyReportButton } from "./CopyReportButton";

type Props = {
  events: AuditEvent[];
};

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function actionBadgeVariant(action: AuditAction) {
  if (action === "CREATE") return "default";
  if (action === "DELETE") return "destructive";
  if (action === "MOVE") return "secondary";
  if (action === "IMPORT_FIX") return "outline";
  if (action === "IMPORT" || action === "EXPORT") return "outline";
  return "secondary"; // UPDATE
}

function formatDateLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatKeyLabel(key: string) {
  const map: Record<string, string> = {
    title: "Título",
    description: "Descripción",
    priority: "Prioridad",
    tags: "Tags",
    estimationMin: "Estimación (min)",
    createdAtISO: "Fecha creación",
    dueAtISO: "Fecha límite",
    status: "Columna",
    rubricScore: "Rúbrica",
    rubricComment: "Comentario",
    javiNotes: "Observaciones",
    id: "ID",
  };
  return map[key] ?? key;
}

function formatValue(key: string, value: unknown) {
  if (value === undefined) return "—";
  if (value === null) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (key === "createdAtISO" || key === "dueAtISO") {
    return formatDateLabel(String(value));
  }
  if (key === "priority" || key === "status") {
    return String(value).toUpperCase();
  }
  return String(value);
}

function renderDiff(e: AuditEvent) {
  const keys = e.diff.changedKeys ?? [];
  if (keys.length === 0) return <span>(sin diff)</span>;

  return (
    <ul className="space-y-1">
      {keys.map((k) => {
        const before = formatValue(String(k), e.diff.before?.[k]);
        const after = formatValue(String(k), e.diff.after?.[k]);
        return (
          <li key={String(k)}>
            <span className="font-medium">{formatKeyLabel(String(k))}:</span>{" "}
            <span className="text-muted-foreground">{before}</span>{" "}
            <span className="text-muted-foreground">→</span>{" "}
            <span>{after}</span>
          </li>
        );
      })}
    </ul>
  );
}

const ACTIONS: (AuditAction | "ALL")[] = [
  "ALL",
  "CREATE",
  "UPDATE",
  "DELETE",
  "MOVE",
  "IMPORT",
  "EXPORT",
];

export function AuditTable({ events }: Props) {
  const [action, setAction] = React.useState<AuditAction | "ALL">("ALL");
  const [taskId, setTaskId] = React.useState("");

  const filtered = React.useMemo(() => {
    return events.filter((e) => {
      if (action !== "ALL" && e.action !== action) return false;
      if (taskId.trim() && !e.taskId.includes(taskId.trim())) return false;
      return true;
    });
  }, [events, action, taskId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[220px]">
            <label className="mb-1 block text-sm font-medium">Acción</label>
            <Select
              value={action}
              onValueChange={(v) => setAction(v as AuditAction | "ALL")}
            >
              <SelectTrigger aria-label="Filtrar por acción">
                <SelectValue placeholder="Selecciona acción" />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[280px]">
            <label className="mb-1 block text-sm font-medium">taskId</label>
            <Input
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="Contiene… (ej: 7f3a-...)"
              aria-label="Filtrar por taskId"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Mostrando <strong>{filtered.length}</strong> / {events.length}
          </div>
          <CopyReportButton events={filtered} />
        </div>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[190px]">Timestamp</TableHead>
              <TableHead className="w-[120px]">Acción</TableHead>
              <TableHead className="w-[320px]">taskId</TableHead>
              <TableHead>Diff</TableHead>
              <TableHead className="w-[120px]">Usuario</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <div className="text-sm text-muted-foreground">
                    No hay eventos con esos filtros.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e, idx) => {
                const rowKey = e.id
                  ? `${e.id}-${e.timestampISO}-${idx}`
                  : `${e.timestampISO}-${e.taskId}-${idx}`;
                return (
                  <TableRow key={rowKey}>
                    <TableCell className="align-top">
                      {formatTs(e.timestampISO)}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={actionBadgeVariant(e.action)}>
                        {e.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs align-top">
                      {e.taskId}
                    </TableCell>
                    <TableCell className="text-xs align-top">
                      {renderDiff(e)}
                    </TableCell>
                    <TableCell className="align-top">{e.userLabel}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



