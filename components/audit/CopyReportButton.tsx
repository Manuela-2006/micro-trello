"use client";

import * as React from "react";
import type { AuditEvent } from "@/types";
import { Button } from "@/components/ui/button";

type Props = {
  events: AuditEvent[];
};

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function compactValue(v: unknown) {
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (Array.isArray(v)) return `[${v.join(", ")}]`;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function buildSummary(events: AuditEvent[]) {
  const total = events.length;
  const byAction: Record<string, number> = {};
  const byTask: Record<string, number> = {};

  for (const e of events) {
    byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    byTask[e.taskId] = (byTask[e.taskId] ?? 0) + 1;
  }

  const lines: string[] = [];
  lines.push("REPORTE AUDITORÍA — Micro Trello Kanban");
  lines.push(`Generado: ${new Date().toLocaleString()}`);
  lines.push(`Total eventos: ${total}`);
  lines.push("");

  lines.push("Eventos por acción:");
  for (const k of Object.keys(byAction).sort()) {
    lines.push(`- ${k}: ${byAction[k]}`);
  }
  lines.push("");

  lines.push("Top taskId (más eventos):");
  const topTasks = Object.entries(byTask)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [taskId, count] of topTasks) {
    lines.push(`- ${taskId}: ${count}`);
  }

  lines.push("");
  lines.push("Últimos eventos (máx 10):");

  const last = events.slice(0, 10); // asumimos newest-first
  for (const e of last) {
    const keys = e.diff.changedKeys?.join(", ") ?? "(sin diff)";
    const before = e.diff.before ? compactValue(e.diff.before) : "";
    const after = e.diff.after ? compactValue(e.diff.after) : "";
    lines.push(
      `- [${formatTs(e.timestampISO)}] ${e.action} task=${e.taskId} keys=${keys} before=${before} after=${after}`
    );
  }

  return lines.join("\n");
}

export function CopyReportButton({ events }: Props) {
  const [copied, setCopied] = React.useState(false);

  async function onCopy() {
    const text = buildSummary(events);

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      const ok = window.confirm(
        "No se pudo copiar automáticamente. ¿Quieres ver el reporte para copiarlo manualmente?"
      );
      if (ok) {
        // eslint-disable-next-line no-alert
        window.alert(text);
      }
    }
  }

  return (
    <Button type="button" variant="outline" onClick={onCopy}>
      {copied ? "Copiado ✅" : "Copiar resumen"}
    </Button>
  );
}

