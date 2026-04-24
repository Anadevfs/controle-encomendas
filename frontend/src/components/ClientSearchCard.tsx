import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, MapPinned, PackagePlus, Phone, Search, User2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api";
import type { Cliente } from "@/types/cliente";

const MIN_SEARCH_LENGTH = 2;

const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const buildClientLabel = (cliente: Cliente) =>
  [cliente.clientName, cliente.companyName, cliente.mailboxNumber]
    .filter(Boolean)
    .join(" ");

const dedupeClients = (clientes: Cliente[]) => {
  const seen = new Map<number, Cliente>();

  clientes.forEach((cliente) => {
    seen.set(cliente.id, cliente);
  });

  return Array.from(seen.values());
};

const searchClientsByName = async (term: string) => {
  const params = new URLSearchParams({ nome: term });
  return apiGet<Cliente[]>(`/clientes/buscar?${params.toString()}`);
};

const fetchAllClients = async () => apiGet<Cliente[]>("/clientes");

interface ClientSearchCardProps {
  selectedClient: Cliente | null;
  onSelectClient: (cliente: Cliente) => void;
  onRegisterPackage: () => void;
  isRegisteringPackage: boolean;
}

const ClientSearchCard = ({
  selectedClient,
  onSelectClient,
  onRegisterPackage,
  isRegisteringPackage,
}: ClientSearchCardProps) => {
  const [query, setQuery] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());

  const allClientsQuery = useQuery({
    queryKey: ["clientes", "all"],
    queryFn: fetchAllClients,
    staleTime: 5 * 60 * 1000,
  });

  const searchQuery = useQuery({
    queryKey: ["clientes", "search", deferredQuery],
    queryFn: () => searchClientsByName(deferredQuery),
    enabled: deferredQuery.length >= MIN_SEARCH_LENGTH,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const suggestions = useMemo(() => {
    if (deferredQuery.length < MIN_SEARCH_LENGTH) {
      return [];
    }

    const normalizedQuery = normalizeText(deferredQuery);
    const filteredAllClients = (allClientsQuery.data ?? []).filter((cliente) =>
      normalizeText(buildClientLabel(cliente)).includes(normalizedQuery)
    );

    return dedupeClients([...(searchQuery.data ?? []), ...filteredAllClients]).slice(0, 8);
  }, [allClientsQuery.data, deferredQuery, searchQuery.data]);

  const isSearching =
    deferredQuery.length >= MIN_SEARCH_LENGTH &&
    (searchQuery.isFetching || allClientsQuery.isFetching);
  const hasApiError =
    !!allClientsQuery.error ||
    (deferredQuery.length >= MIN_SEARCH_LENGTH && !!searchQuery.error);

  useEffect(() => {
    if (!selectedClient) {
      return;
    }

    setQuery(selectedClient.clientName);
  }, [selectedClient]);

  return (
    <div className="eva-card-elevated rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="h-1 w-5 rounded-full bg-primary" />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
            Cadastro de Encomenda
          </p>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Buscar cliente real
          </h2>
        </div>
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsListOpen(true);
            }}
            onFocus={() => {
              setIsListOpen(true);

              if (allClientsQuery.isError) {
                void allClientsQuery.refetch();
              }

              if (searchQuery.isError && deferredQuery.length >= MIN_SEARCH_LENGTH) {
                void searchQuery.refetch();
              }
            }}
            placeholder="Buscar por cliente, empresa ou caixa postal"
            className="h-11 rounded-xl border-border bg-surface-2 pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {isListOpen && query.trim().length > 0 && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-lg">
            {query.trim().length < MIN_SEARCH_LENGTH ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para buscar.
              </p>
            ) : hasApiError ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Nao foi possivel consultar os clientes agora. Verifique se o backend esta ativo.
              </p>
            ) : suggestions.length > 0 ? (
              <div className="max-h-72 overflow-y-auto py-2">
                {suggestions.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => {
                      onSelectClient(cliente);
                      setQuery(cliente.clientName);
                      setIsListOpen(false);
                    }}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{cliente.clientName}</p>
                      <p className="truncate text-sm text-muted-foreground">{cliente.companyName}</p>
                    </div>
                    <span className="rounded-full bg-eva-red-light px-2.5 py-1 text-xs font-semibold text-primary">
                      Caixa {cliente.mailboxNumber}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Nenhum cliente encontrado com esse termo.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ClientDetailItem
          icon={User2}
          label="Cliente"
          value={selectedClient?.clientName ?? "Selecione um cliente para preencher"}
        />
        <ClientDetailItem
          icon={Building2}
          label="Empresa"
          value={selectedClient?.companyName ?? "Aguardando selecao"}
        />
        <ClientDetailItem
          icon={MapPinned}
          label="Caixa postal"
          value={selectedClient?.mailboxNumber ?? "Aguardando selecao"}
        />
        <ClientDetailItem
          icon={Phone}
          label="WhatsApp"
          value={selectedClient?.whatsapp || "Nao informado"}
        />
      </div>

      <Button
        type="button"
        className="h-11 w-full rounded-xl"
        disabled={!selectedClient || isRegisteringPackage}
        onClick={onRegisterPackage}
      >
        {isRegisteringPackage ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PackagePlus className="h-4 w-4" />
        )}
        {isRegisteringPackage ? "Registrando encomenda" : "Registrar encomenda"}
      </Button>

      <p className="text-xs text-muted-foreground border-t border-border pt-3">
        Buscar ou selecionar um cliente apenas preenche os dados. O registro acontece somente pelo botao acima.
      </p>
    </div>
  );
};

const ClientDetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User2;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2.5 rounded-xl bg-surface-2 px-3 py-3">
    <div className="rounded-lg bg-eva-red-light p-1.5">
      <Icon className="h-3.5 w-3.5 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default ClientSearchCard;
