"use client";

import * as React from "react";

import type { BoardState } from "@/types";
import { loadState, saveState } from "@/lib/storage";
import { parseQuery, buildFilteredState } from "@/lib/query";

import { Board } from "@/components/board/Board";
import { AuditTable } from "@/components/audit/AuditTable";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

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
  // Hooks siempre arriba, siempre en el mismo orden
  const [state, setState] = React.useState<BoardState | null>(null);
  const [tab, setTab] = React.useState<"board" | "audit">("board");
  const [searchText, setSearchText] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  // AlertDialog state
  const [importOpen, setImportOpen] = React.useState(false);
  const [importTitle, setImportTitle] = React.useState("");
  const [importMessage, setImportMessage] = React.useState("");
  const [importDetails, setImportDetails] = React.useState<string | null>(null);

  // cargar estado al montar (solo una vez)
  React.useEffect(() => {
    const s = loadState();
    setState(s);
  }, []);

  // autosave con debounce (cuando ya hay state)
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
      const next = await importBoardStateFromFile(file);
      setState(next);
      setTab("board");
      // opcional: limpiar búsqueda si estaba filtrando
      // setSearchText("");

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

  // No hagas return antes de hooks: ya están todos arriba
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
              <Button type="button" variant="outline" aria-label="Ver ejemplos de búsqueda">
                Ejemplos
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Búsqueda avanzada</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Texto libre: <span className="font-mono">cliente vip</span>
                  </li>
                  <li>
                    Tag exacto: <span className="font-mono">tag:compliance</span>
                  </li>
                  <li>
                    Prioridad: <span className="font-mono">p:high</span>
                  </li>
                  <li>
                    Vencimiento: <span className="font-mono">due:overdue</span> /{" "}
                    <span className="font-mono">due:week</span>
                  </li>
                  <li>
                    Estimación: <span className="font-mono">est:&lt;60</span> -{" "}
                    <span className="font-mono">est:&gt;=120</span>
                  </li>
                </ul>
                <p className="text-muted-foreground">
                  Puedes combinar:{" "}
                  <span className="font-mono">tag:reports p:medium est:&gt;=60</span>
                </p>
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

      {/* AlertDialog Import result */}
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
