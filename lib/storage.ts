import { BoardState } from "@/types";
import { createDefaultState } from "@/lib/seed";

/**
 * Clave única de localStorage para la app
 * Versionada para evitar conflictos futuros
 */
const STORAGE_KEY = "micro-trello-board-v1";

/**
 * Carga el estado desde localStorage.
 * - Si no hay nada guardado, devuelve el estado por defecto (seed)
 * - Si hay error de parseo, también devuelve el estado por defecto
 */
export function loadState(): BoardState {
  if (typeof window === "undefined") {
    // Seguridad para SSR (Next.js)
    return createDefaultState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw) as BoardState;

    // Validación mínima de estructura
    if (
      parsed.version !== 1 ||
      typeof parsed.tasks !== "object" ||
      typeof parsed.columns !== "object" ||
      !Array.isArray(parsed.audit)
    ) {
      console.warn("Estado inválido en localStorage. Se usa estado por defecto.");
      return createDefaultState();
    }

    return parsed;
  } catch (error) {
    console.error("Error cargando estado desde localStorage:", error);
    return createDefaultState();
  }
}

/**
 * Guarda el estado completo en localStorage
 */
export function saveState(state: BoardState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error("Error guardando estado en localStorage:", error);
  }
}

/**
 * Limpia el estado guardado en localStorage
 * Útil para debug o reset manual
 */
export function clearStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}
