# Micro Trello Kanban

Tablero kanban con auditoría de cambios, búsqueda avanzada y modo evaluación. Basado en Next.js (App Router) y persistencia local.

**Objetivo**

Construir un micro Trello para gestionar tareas con drag & drop, búsqueda avanzada y auditoría de cambios, con persistencia local y soporte de evaluación.

**Cómo usar**

1. Crea una tarea con el botón `+` o `Nueva tarea`, completa título y campos opcionales, y guarda.
2. Arrastra tareas entre columnas para cambiar su estado. Reordena dentro de la columna con drag & drop.
3. Usa la barra de búsqueda con texto libre o filtros como `tag:`, `p:` (prioridad), `due:` (fecha) y `est:` (estimación).
4. Abre una tarea para ver su historial y el `diff` de cambios en la auditoría.
5. Exporta o importa el tablero desde el menú de opciones para guardar o recuperar el estado.
6. Activa el modo dios para evaluarc las tareas y añadir comentarios y observaciones.

**Capturas (3)**
<img width="1894" height="951" alt="image" src="https://github.com/user-attachments/assets/228ab6e0-81f1-4a2a-aae7-5cb6b4820bbc" />
<img width="809" height="894" alt="image" src="https://github.com/user-attachments/assets/c5059fce-6762-4266-9e24-b5ee657c3c70" />
<img width="1892" height="784" alt="image" src="https://github.com/user-attachments/assets/ee5fe4d2-7d92-4ef6-a1b0-09b2b62e3270" />



**Enlace a Vercel**
(https://micro-trello-nu.vercel.app/)

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
