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
  return "secondary"; // UPDATE
}

function compact(v: unknown) {
  if (v === undefined) return "";
  if (v === null) return "null";
  if (Array.isArray(v)) return `[${v.join(", ")}]`;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function diffPreview(e: AuditEvent) {
  const keys = e.diff.changedKeys ?? [];
  if (keys.length === 0) return "(sin diff)";

  // mostramos solo una vista humana de antes/después para keys
  const before: Record<string, string> = {};
  const after: Record<string, string> = {};

  for (const k of keys) {
    before[String(k)] = compact(e.diff.before?.[k]);
    after[String(k)] = compact(e.diff.after?.[k]);
  }

  return `keys=${keys.join(", ")} | before=${JSON.stringify(
    before
  )} | after=${JSON.stringify(after)}`;
}

const ACTIONS: (AuditAction | "ALL")[] = [
  "ALL",
  "CREATE",
  "UPDATE",
  "DELETE",
  "MOVE",
  "IMPORT_FIX",
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
              filtered.map((e) => (
                <TableRow key={e.id}>
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
                  <TableCell className="font-mono text-xs align-top">
                    {diffPreview(e)}
                  </TableCell>
                  <TableCell className="align-top">{e.userLabel}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
