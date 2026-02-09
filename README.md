# Micro Trello Kanban

Tablero kanban con auditoría de cambios, búsqueda avanzada y modo evaluación. Basado en Next.js (App Router) y persistencia local.

**Checklist de requisitos**

- `CRUD` de tareas (crear, editar, eliminar) con validación de formulario
- `Drag & drop` entre columnas y reordenado dentro de la misma columna
- Búsqueda con `query language` (texto libre + filtros por tag/prioridad/fecha/estimación)
- Auditoría de cambios con `diff` parcial por tarea
- Persistencia en `localStorage` y export/import de estado
- Modo evaluación con campos de rúbrica y notas

**Decisiones técnicas (5-10 líneas)**

- Estructura `tasks` + `columns` en `BoardState` para O(1) por ID y arrays ordenados por columna, evitando duplicar datos en UI (ver `src/types.ts` y `docs/decisions.md`).
- La query se parsea en `lib/query.ts` con un parser simple de tokens (`tag:`, `p:`, `due:`, `est:`) que arma un `SearchQuery` tipado y luego filtra por predicados.
- El filtrado mantiene el estado original y solo reemplaza `columns` con IDs visibles (`buildFilteredState`), lo que evita mutar `tasks` o `audit`.
- El diff se guarda como `AuditDiff` parcial (`before/after/changedKeys`) en `lib/audit.ts` para reducir ruido en el log.
- La persistencia usa `localStorage` con clave versionada (`micro-trello-board-v1`) y validación básica al cargar (`lib/storage.ts`).
- La importación valida con Zod y normaliza inconsistencias (IDs duplicados, tareas huérfanas, status inválido) en `lib/transfer.ts`.
