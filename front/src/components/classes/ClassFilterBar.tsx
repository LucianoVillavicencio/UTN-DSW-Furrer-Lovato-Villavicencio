import { Search, Filter, X } from "lucide-react";
import type { TipoClase } from "../../types/tipo-clase";

interface ClassFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTipoId: number | "ALL";
  setSelectedTipoId: (id: number | "ALL") => void;
  tiposClase: TipoClase[];
}

const ClassFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedTipoId,
  setSelectedTipoId,
  tiposClase,
}: ClassFilterBarProps) => {
  return (
    <div className="mb-10 rounded-2xl border border-border bg-surface/80 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de clase o instructor..."
            className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm text-text placeholder-text-muted transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted mr-2">
            <Filter className="h-3.5 w-3.5" /> Filtrar:
          </span>

          <button
            onClick={() => setSelectedTipoId("ALL")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              selectedTipoId === "ALL"
                ? "bg-primary text-background font-semibold shadow-sm"
                : "bg-background/80 text-text-muted hover:bg-surface hover:text-text"
            }`}
          >
            Todas las disciplinas
          </button>

          {tiposClase.map((tipo) => (
            <button
              key={tipo.id}
              onClick={() => setSelectedTipoId(tipo.id || "ALL")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                selectedTipoId === tipo.id
                  ? "bg-primary text-background font-semibold shadow-sm"
                  : "bg-background/80 text-text-muted hover:bg-surface hover:text-text"
              }`}
            >
              {tipo.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassFilterBar;
