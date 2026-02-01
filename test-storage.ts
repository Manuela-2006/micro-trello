import { loadState, saveState, clearStorage } from "@/lib/storage";
import { createDefaultState } from "@/lib/seed";

console.log("Limpiando storage...");
clearStorage();

console.log("Cargando estado inicial...");
const state1 = loadState();
console.log("Tareas iniciales:", Object.keys(state1.tasks).length);

console.log("Guardando estado...");
saveState(state1);

console.log("Cargando estado desde storage...");
const state2 = loadState();
console.log("Tareas cargadas:", Object.keys(state2.tasks).length);
