import { Package } from "@/data/mockData";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

const statusConfig = {
  enviado: { label: "Entregue", dotClass: "bg-eva-green", textClass: "text-eva-green", bgClass: "bg-eva-green-light" },
  pendente: { label: "Comunicado", dotClass: "bg-eva-warning", textClass: "text-eva-warning", bgClass: "bg-eva-warning-light" },
  atrasado: { label: "Atrasado", dotClass: "bg-eva-danger", textClass: "text-eva-danger", bgClass: "bg-eva-danger-light" },
};

interface PackageTableProps {
  packages: Package[];
  selectedId: number | null;
  onSelect: (pkg: Package) => void;
  onDelete: (pkg: Package) => void;
}

const PackageTable = ({ packages, selectedId, onSelect, onDelete }: PackageTableProps) => {
  return (
    <div className="eva-card-elevated rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="h-1 w-5 rounded-full bg-primary" />
        <h2 className="font-heading text-lg font-semibold tracking-wide text-foreground">
          Encomendas Recebidas Hoje
        </h2>
      </div>
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Cliente</th>
              <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Caixa Postal / Empresa</th>
              <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Horario</th>
              <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Funcionario</th>
              <th className="px-5 py-3 text-right font-medium text-xs uppercase tracking-wider text-muted-foreground">Acao</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg, i) => {
              const cfg = statusConfig[pkg.status];
              const isSelected = selectedId === pkg.id;

              return (
                <motion.tr
                  key={pkg.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelect(pkg)}
                  className={`border-b border-border cursor-pointer transition-colors duration-200 ${
                    isSelected ? "bg-eva-red-light" : "hover:bg-surface-2"
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-foreground">{pkg.cliente}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    Caixa Postal {pkg.sala} · {pkg.empresa}
                  </td>
                  <td className="px-5 py-3 font-heading tabular-nums text-foreground">{pkg.horario}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bgClass} ${cfg.textClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{pkg.funcionario}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Excluir encomenda de ${pkg.cliente}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(pkg);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-eva-danger-light hover:text-eva-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PackageTable;
