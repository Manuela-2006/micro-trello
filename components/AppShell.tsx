"use client";

import * as React from "react";
import type { BoardState } from "@/types";
import { loadState, saveState } from "@/lib/storage";
import { parseQuery, buildFilteredState } from "@/lib/query";
import { Board } from "@/components/board/Board";
import { AuditTable } from "@/components/audit/AuditTable";
import { GodModePanel } from "@/components/god/GodModePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportBoardState, importBoardStateFromFile } from "@/lib/transfer";

const STORAGE_DEBOUNCE_MS = 250;

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function AppShell() {
  const [state, setState] = React.useState<BoardState | null>(null);
  const [tab, setTab] = React.useState<"board" | "audit">("board");
  const [searchText, setSearchText] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const [importOpen, setImportOpen] = React.useState(false);
  const [importTitle, setImportTitle] = React.useState("");
  const [importMessage, setImportMessage] = React.useState("");
  const [importDetails, setImportDetails] = React.useState<string | null>(null);

  React.useEffect(() => {
    const s = loadState();
    setState(s);
  }, []);

  const debouncedSave = React.useMemo(
    () =>
      debounce((s: BoardState) => {
        saveState(s);
      }, STORAGE_DEBOUNCE_MS),
    []
  );

  React.useEffect(() => {
    if (!state) return;
    debouncedSave(state);
  }, [state, debouncedSave]);

  const q = React.useMemo(() => parseQuery(searchText), [searchText]);
  const filteredState = React.useMemo(
    () => (state ? buildFilteredState(state, q) : null),
    [state, q]
  );

  const isFiltering = searchText.trim().length > 0;

  async function handleImportFile(file: File) {
    try {
      const next = await importBoardStateFromFile(file, state);
      setState(next);
      setTab("board");
      setImportTitle("Importación correcta ✅");
      setImportMessage("El tablero se ha importado y validado correctamente.");
      setImportDetails(null);
      setImportOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido al importar.";
      setImportTitle("No se pudo importar ❌");
      setImportMessage("El archivo JSON no es válido o no cumple el esquema.");
      setImportDetails(msg);
      setImportOpen(true);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleToggleGodMode(checked: boolean) {
    setState((prev) => (prev ? { ...prev, godMode: checked } : prev));
  }

  if (!state) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Micro Trello Kanban</h1>
        <p className="mt-2 text-sm text-muted-foreground">Cargando estado...</p>
      </main>
    );
  }

  const countsSource = isFiltering && filteredState ? filteredState : state;
  const todo = countsSource.columns.todo.length;
  const doing = countsSource.columns.doing.length;
  const done = countsSource.columns.done.length;
  const total = todo + doing + done;

  return (
    <main className="p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Micro Trello Kanban</h1>
        <p className="text-sm text-muted-foreground">
          Tareas: {total} - Todo: {todo} - Doing: {doing} - Done: {done}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder='Buscar... ej: "cliente" tag:compliance p:high due:week est:<60'
              aria-label="Búsqueda avanzada"
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Switch
              checked={state.godMode}
              onCheckedChange={handleToggleGodMode}
              aria-label="Activar modo evaluación"
            />
            <span className="text-sm">Modo Dios</span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => exportBoardState(state)}
            aria-label="Exportar tablero a JSON"
          >
            Exportar
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            aria-label="Importar tablero desde JSON"
          >
            Importar
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
            }}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" aria-label="Guía de teclado">
                Guía de teclado
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Guía rápida de teclado</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Crear tarea: <span className="font-mono">Tab</span> hasta el botón{" "}
                    <span className="font-mono">+</span> y pulsa{" "}
                    <span className="font-mono">Enter</span>
                  </li>
                  <li>
                    Editar tarea: <span className="font-mono">Tab</span> hasta{" "}
                    <span className="font-mono">Editar</span> y pulsa{" "}
                    <span className="font-mono">Enter</span>
                  </li>
                  <li>
                    Borrar tarea: <span className="font-mono">Tab</span> hasta{" "}
                    <span className="font-mono">Borrar</span> y pulsa{" "}
                    <span className="font-mono">Enter</span>
                  </li>
                  <li>
                    Mover tarea: enfoca el{" "}
                    <span className="font-mono">handle ::</span>, pulsa{" "}
                    <span className="font-mono">Espacio</span> para levantar,{" "}
                    <span className="font-mono">↑/↓</span> para mover,{" "}
                    <span className="font-mono">Espacio</span> para soltar
                  </li>
                  <li>
                    Cerrar diálogos: <span className="font-mono">Esc</span>
                  </li>
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "board" | "audit")}>
        <TabsList>
          <TabsTrigger value="board">Kanban</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          {/* ✅ FASE 10: Panel resumen cuando Modo Dios está activo */}
          {state.godMode && (
            <div className="mb-6">
              <GodModePanel state={state} />
            </div>
          )}

          <Board
            state={state}
            setState={setState}
            visibleColumns={filteredState?.columns}
            dragDisabled={isFiltering}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditTable events={state.audit} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={importOpen} onOpenChange={setImportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{importTitle}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>{importMessage}</p>
                {importDetails && (
                  <pre className="mt-3 max-h-64 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">
                    {importDetails}
                  </pre>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Cerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

