import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Archive, CheckCircle2, AlertTriangle, Info, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { Package } from "@/data/mockData";

const statusLabelMap = {
  enviado: "Entregue",
  pendente: "Comunicado",
  atrasado: "Atrasado",
} as const;

const typeConfig = {
  success: { icon: CheckCircle2, colorClass: "text-eva-green", dotClass: "bg-eva-green" },
  info: { icon: Info, colorClass: "text-primary", dotClass: "bg-primary" },
  danger: { icon: AlertTriangle, colorClass: "text-eva-danger", dotClass: "bg-eva-danger" },
};

interface RecentEventsProps {
  packages: Package[];
}

const normalizeText = (value: string | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const RecentEvents = ({ packages }: RecentEventsProps) => {
  const [query, setQuery] = useState("");

  const filteredPackages = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    if (!normalizedQuery) {
      return packages;
    }

    return packages.filter((pkg) =>
      [
        pkg.cliente,
        pkg.empresa,
        pkg.sala,
        pkg.funcionario,
        pkg.recebidoPor,
        pkg.marcadoEnviadoPor,
        pkg.horario,
      ].some((value) => normalizeText(value).includes(normalizedQuery))
    );
  }, [packages, query]);

  return (
    <div className="eva-card-elevated rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="h-1 w-5 rounded-full bg-primary" />
        <Archive className="h-4 w-4 text-primary" />
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-lg font-semibold tracking-wide text-foreground">Encomendas Recebidas</h2>
        </div>
      </div>
      <div className="p-4 border-b border-border bg-background/50">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente, empresa, caixa postal, funcionario ou horario"
            className="h-10 rounded-xl border-border bg-surface-2 pl-10"
          />
        </div>
      </div>
      <div className="p-4 space-y-1 max-h-[220px] overflow-auto">
        {filteredPackages.length === 0 && (
          <div className="rounded-lg px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhuma encomenda encontrada com esse filtro.
          </div>
        )}
        {filteredPackages.map((pkg, i) => {
          const eventType =
            pkg.status === "enviado" ? "success" : pkg.status === "atrasado" ? "danger" : "info";
          const cfg = typeConfig[eventType];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={`${pkg.id}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-2 transition-colors"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass} flex-shrink-0`} />
              <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${cfg.colorClass}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {pkg.cliente} · Caixa Postal {pkg.sala} · {pkg.empresa || "Empresa nao informada"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Funcionario: {pkg.funcionario || "Nao informado"} · Status: {statusLabelMap[pkg.status]}
                </p>
              </div>
              <span className="font-heading text-xs tabular-nums text-muted-foreground">{pkg.horario}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentEvents;
