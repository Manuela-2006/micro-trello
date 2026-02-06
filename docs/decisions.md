# Decisiones de diseño del modelo de datos

## Estado normalizado

**Decisión:** Separar `tasks` (Record por ID) de `columns` (arrays de IDs).

**Razón:**
- Facilita operaciones de mover tareas entre columnas (solo manipular arrays)
- Evita duplicación de datos
- Permite ordenamiento independiente por columna
- Simplifica auditorÍa (solo cambia el status de la tarea)

## AuditorÍa con diff parcial

**Decisión:** `AuditDiff` solo guarda campos que cambiaron (`changedKeys`).

**Razón:**
- Evita ruido en el log (no guardamos todo el objeto)
- Facilita lectura humana del historial
- Demuestra comprensión del problema (no es "snapshot automático")
- Permite reconstruir estado si fuera necesario

## Modo Dios integrado en Task

**Decisión:** Campos `javiNotes`, `rubricScore`, `rubricComment` dentro de `Task`.

**Razón:**
- Persisten aunque el modo esté desactivado
- No complica el modelo con estructuras separadas
- AuditorÍa funciona igual (UPDATE registra cambios en estos campos)
- Más simple de implementar y mantener
