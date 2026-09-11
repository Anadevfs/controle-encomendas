import { useMemo, useState } from "react";

import { Package } from "@/data/mockData";
import { motion } from "framer-motion";
import { RotateCcw, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPackageScheduleLabel } from "@/lib/package-datetime";
import { getEffectivePackageStatus } from "@/lib/package-status";

const statusConfig = {
  enviado: { label: "Entregue", dotClass: "bg-eva-green", textClass: "text-eva-green", bgClass: "bg-eva-green-light" },
  pendente: { label: "Comunicado", dotClass: "bg-eva-warning", textClass: "text-eva-warning", bgClass: "bg-eva-warning-light" },
  atrasado: { label: "Atrasado", dotClass: "bg-eva-danger", textClass: "text-eva-danger", bgClass: "bg-eva-danger-light" },
};

const ALL_FILTER_VALUE = "todos";

const statusFilterOptions = [
  { value: ALL_FILTER_VALUE, label: "Todas" },
  { value: "pendente", label: "Pendente" },
  { value: "comunicado", label: "Comunicado" },
  { value: "enviado", label: "Entregue" },
  { value: "atrasado", label: "Atrasado" },
] as const;

const dateFilterOptions = [
  { value: ALL_FILTER_VALUE, label: "Todas" },
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "ultimos-7-dias", label: "Ultimos 7 dias" },
  { value: "este-mes", label: "Este mes" },
  { value: "personalizada", label: "Personalizada" },
] as const;

type StatusFilter = (typeof statusFilterOptions)[number]["value"];
type DateFilter = (typeof dateFilterOptions)[number]["value"];

interface PackageTableProps {
  packages: Package[];
  selectedId: number | null;
  onSelect: (pkg: Package) => void;
  onDelete: (pkg: Package) => void;
}

const normalizeText = (value: string | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const getPackageStatusTerms = (pkg: Package) => {
  const effectiveStatus = getEffectivePackageStatus(pkg);
  const statusLabel = statusConfig[effectiveStatus].label;
  const terms = [effectiveStatus, statusLabel];

  if (effectiveStatus === "pendente") {
    terms.push("Pendente");
  }

  return terms;
};

const getSearchablePackageValues = (pkg: Package) => [
  pkg.cliente,
  pkg.empresa,
  pkg.sala,
  `Caixa Postal ${pkg.sala}`,
  pkg.funcionario,
  ...getPackageStatusTerms(pkg),
];

const getUniqueOptions = (packages: Package[], field: keyof Pick<Package, "funcionario" | "sala">) =>
  Array.from(
    new Map(
      packages
        .map((pkg) => pkg[field]?.trim())
        .filter((value): value is string => !!value && value !== "-")
        .map((value) => [normalizeText(value), value])
    ).values()
  ).sort((left, right) => left.localeCompare(right, "pt-BR"));

const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getPackageDateKey = (pkg: Package) => {
  const directDateMatch = pkg.dataRecebimento?.match(/^(\d{4}-\d{2}-\d{2})/);

  if (directDateMatch) {
    return directDateMatch[1];
  }

  if (!pkg.dataRecebimento) {
    return null;
  }

  const parsedDate = new Date(pkg.dataRecebimento);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return getLocalDateKey(parsedDate);
};

const matchesStatusFilter = (pkg: Package, statusFilter: StatusFilter) => {
  if (statusFilter === ALL_FILTER_VALUE) {
    return true;
  }

  const effectiveStatus = getEffectivePackageStatus(pkg);

  if (statusFilter === "comunicado" || statusFilter === "pendente") {
    return effectiveStatus === "pendente";
  }

  return effectiveStatus === statusFilter;
};

const matchesDateFilter = (
  pkg: Package,
  dateFilter: DateFilter,
  customStartDate: string,
  customEndDate: string
) => {
  if (dateFilter === ALL_FILTER_VALUE) {
    return true;
  }

  const packageDateKey = getPackageDateKey(pkg);

  if (!packageDateKey) {
    return false;
  }

  const today = new Date();
  const todayKey = getLocalDateKey(today);

  if (dateFilter === "hoje") {
    return packageDateKey === todayKey;
  }

  if (dateFilter === "ontem") {
    return packageDateKey === getLocalDateKey(addDays(today, -1));
  }

  if (dateFilter === "ultimos-7-dias") {
    const startKey = getLocalDateKey(addDays(today, -6));
    return packageDateKey >= startKey && packageDateKey <= todayKey;
  }

  if (dateFilter === "este-mes") {
    return packageDateKey.startsWith(todayKey.slice(0, 7));
  }

  const hasStartDate = !!customStartDate;
  const hasEndDate = !!customEndDate;

  if (!hasStartDate && !hasEndDate) {
    return true;
  }

  return (!hasStartDate || packageDateKey >= customStartDate) && (!hasEndDate || packageDateKey <= customEndDate);
};

const PackageTable = ({ packages, selectedId, onSelect, onDelete }: PackageTableProps) => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_FILTER_VALUE);
  const [dateFilter, setDateFilter] = useState<DateFilter>(ALL_FILTER_VALUE);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState(ALL_FILTER_VALUE);
  const [mailboxFilter, setMailboxFilter] = useState(ALL_FILTER_VALUE);
  const [clientFilter, setClientFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [mailboxNumberFilter, setMailboxNumberFilter] = useState("");
  const employeeOptions = useMemo(() => getUniqueOptions(packages, "funcionario"), [packages]);
  const mailboxOptions = useMemo(() => getUniqueOptions(packages, "sala"), [packages]);
  const filteredPackages = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const normalizedEmployeeFilter = normalizeText(employeeFilter);
    const normalizedMailboxFilter = normalizeText(mailboxFilter);
    const normalizedClientFilter = normalizeText(clientFilter);
    const normalizedCompanyFilter = normalizeText(companyFilter);
    const normalizedMailboxNumberFilter = normalizeText(mailboxNumberFilter);

    return packages.filter((pkg) => {
      const searchableValues = getSearchablePackageValues(pkg);
      const matchesGeneralSearch =
        !normalizedQuery || searchableValues.some((value) => normalizeText(value).includes(normalizedQuery));

      return (
        matchesGeneralSearch &&
        matchesStatusFilter(pkg, statusFilter) &&
        matchesDateFilter(pkg, dateFilter, customStartDate, customEndDate) &&
        (employeeFilter === ALL_FILTER_VALUE || normalizeText(pkg.funcionario) === normalizedEmployeeFilter) &&
        (mailboxFilter === ALL_FILTER_VALUE || normalizeText(pkg.sala) === normalizedMailboxFilter) &&
        (!normalizedClientFilter || normalizeText(pkg.cliente).includes(normalizedClientFilter)) &&
        (!normalizedCompanyFilter || normalizeText(pkg.empresa).includes(normalizedCompanyFilter)) &&
        (!normalizedMailboxNumberFilter || normalizeText(pkg.sala).includes(normalizedMailboxNumberFilter))
      );
    });
  }, [
    packages,
    query,
    statusFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    employeeFilter,
    mailboxFilter,
    clientFilter,
    companyFilter,
    mailboxNumberFilter,
  ]);

  const handleClearFilters = () => {
    setQuery("");
    setStatusFilter(ALL_FILTER_VALUE);
    setDateFilter(ALL_FILTER_VALUE);
    setCustomStartDate("");
    setCustomEndDate("");
    setEmployeeFilter(ALL_FILTER_VALUE);
    setMailboxFilter(ALL_FILTER_VALUE);
    setClientFilter("");
    setCompanyFilter("");
    setMailboxNumberFilter("");
  };

  return (
    <div className="eva-card-elevated rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="h-1 w-5 rounded-full bg-primary" />
        <h2 className="font-heading text-lg font-semibold tracking-wide text-foreground">
          Encomendas Recebidas Hoje
        </h2>
      </div>
      <div className="px-5 py-4 border-b border-border bg-background/60">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative lg:max-w-sm lg:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por cliente, empresa, caixa, status ou funcionario"
                className="h-10 rounded-xl border-border bg-surface-2 pl-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="h-10 rounded-xl border-border"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-surface-2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-surface-2">
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                {dateFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-surface-2">
                <SelectValue placeholder="Funcionario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>Todos funcionarios</SelectItem>
                {employeeOptions.map((employee) => (
                  <SelectItem key={employee} value={employee}>
                    {employee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={mailboxFilter} onValueChange={setMailboxFilter}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-surface-2">
                <SelectValue placeholder="Caixa postal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>Todas caixas</SelectItem>
                {mailboxOptions.map((mailbox) => (
                  <SelectItem key={mailbox} value={mailbox}>
                    Caixa Postal {mailbox}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dateFilter === "personalizada" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:max-w-xl">
              <Input
                type="date"
                value={customStartDate}
                onChange={(event) => setCustomStartDate(event.target.value)}
                aria-label="Data inicial"
                className="h-10 rounded-xl border-border bg-surface-2"
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(event) => setCustomEndDate(event.target.value)}
                aria-label="Data final"
                className="h-10 rounded-xl border-border bg-surface-2"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              placeholder="Cliente"
              className="h-10 rounded-xl border-border bg-surface-2"
            />
            <Input
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              placeholder="Empresa"
              className="h-10 rounded-xl border-border bg-surface-2"
            />
            <Input
              value={mailboxNumberFilter}
              onChange={(event) => setMailboxNumberFilter(event.target.value)}
              placeholder="Numero da caixa postal"
              className="h-10 rounded-xl border-border bg-surface-2"
            />
          </div>
        </div>
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
            {filteredPackages.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma encomenda encontrada para essa busca.
                </td>
              </tr>
            )}
            {filteredPackages.map((pkg, i) => {
              const effectiveStatus = getEffectivePackageStatus(pkg);
              const cfg = statusConfig[effectiveStatus];
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
                  <td className="px-5 py-3 font-heading tabular-nums text-foreground">{formatPackageScheduleLabel(pkg)}</td>
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
