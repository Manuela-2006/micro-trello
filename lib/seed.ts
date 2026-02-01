import { Task, BoardState, ColumnId } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Crea el estado inicial de la aplicación con tareas de ejemplo
 * Tema: Operaciones de un broker junior
 */
export function createDefaultState(): BoardState {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Tareas de ejemplo con datos coherentes
  const tasks: Task[] = [
    // ========== TODO ==========
    {
      id: uuidv4(),
      title: "Revisar compliance Q1 2025",
      description:
        "Auditoría trimestral de cumplimiento normativo MiFID II y reglamento de abuso de mercado",
      priority: "high",
      tags: ["compliance", "quarterly", "urgent"],
      estimationMin: 180,
      createdAtISO: now.toISOString(),
      dueAtISO: twoDaysFromNow.toISOString(),
      status: "todo",
    },
    {
      id: uuidv4(),
      title: "Preparar informe cliente VIP",
      description:
        "Reporte mensual de rendimiento cartera Sr. Martínez - incluir análisis de riesgo ajustado",
      priority: "high",
      tags: ["client-facing", "reports", "vip"],
      estimationMin: 120,
      createdAtISO: yesterday.toISOString(),
      dueAtISO: nextWeek.toISOString(),
      status: "todo",
    },
    {
      id: uuidv4(),
      title: "Actualizar base de datos operaciones",
      description: "Registrar todas las operaciones del viernes en el sistema interno",
      priority: "low",
      tags: ["database", "routine"],
      estimationMin: 45,
      createdAtISO: yesterday.toISOString(),
      status: "todo",
    },
    {
      id: uuidv4(),
      title: "Solicitar documentación KYC nuevo cliente",
      description: "Empresa Logística del Norte S.L. - pendiente de validación de identidad",
      priority: "medium",
      tags: ["compliance", "client-onboarding"],
      estimationMin: 60,
      createdAtISO: now.toISOString(),
      dueAtISO: nextWeek.toISOString(),
      status: "todo",
    },

    // ========== DOING ==========
    {
      id: uuidv4(),
      title: "Ejecutar rebalanceo cartera diversificada",
      description:
        "Ajustar posiciones según nuevas directrices CIO - reducir exposición tech, aumentar utilities",
      priority: "medium",
      tags: ["trading", "portfolio"],
      estimationMin: 90,
      createdAtISO: yesterday.toISOString(),
      dueAtISO: tomorrow.toISOString(),
      status: "doing",
    },
    {
      id: uuidv4(),
      title: "Revisar alertas de riesgo pendientes",
      description: "Monitorear posiciones con VaR por encima del umbral establecido",
      priority: "medium",
      tags: ["risk-management", "monitoring"],
      estimationMin: 60,
      createdAtISO: now.toISOString(),
      status: "doing",
    },
    {
      id: uuidv4(),
      title: "Validar órdenes ejecutadas ayer",
      description: "Confirmar que todas las ejecuciones del día anterior están correctamente registradas",
      priority: "low",
      tags: ["validation", "routine"],
      estimationMin: 30,
      createdAtISO: now.toISOString(),
      status: "doing",
    },

    // ========== DONE ==========
    {
      id: uuidv4(),
      title: "Archivar documentación enero",
      description: "Escanear y clasificar todos los contratos firmados durante el mes",
      priority: "low",
      tags: ["archive", "routine"],
      estimationMin: 90,
      createdAtISO: threeDaysAgo.toISOString(),
      status: "done",
    },
    {
      id: uuidv4(),
      title: "Presentación mensual equipo",
      description: "Resumen de KPIs de enero - volumen operado, nuevos clientes, margen neto",
      priority: "medium",
      tags: ["reports", "internal"],
      estimationMin: 60,
      createdAtISO: threeDaysAgo.toISOString(),
      status: "done",
    },
    {
      id: uuidv4(),
      title: "Calibrar sistema de alertas",
      description: "Ajustar parámetros de notificaciones automáticas de riesgo",
      priority: "low",
      tags: ["systems", "maintenance"],
      estimationMin: 45,
      createdAtISO: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: "done",
    },
  ];

  // Convertir array de tareas a estructura normalizada
  const tasksById: Record<string, Task> = {};
  const columns: Record<ColumnId, string[]> = {
    todo: [],
    doing: [],
    done: [],
  };

  tasks.forEach((task) => {
    tasksById[task.id] = task;
    columns[task.status].push(task.id);
  });

  return {
    version: 1,
    tasks: tasksById,
    columns,
    audit: [], // Inicialmente sin eventos de auditoría
    godMode: false, // Modo Dios desactivado por defecto
  };
}
