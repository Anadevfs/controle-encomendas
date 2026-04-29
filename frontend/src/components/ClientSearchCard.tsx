import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, MapPinned, PackagePlus, Pencil, Phone, Plus, Search, User2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost, apiPut } from "@/lib/api";
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

type ClientePayload = Omit<Cliente, "id">;
type ClientFormMode = "create" | "edit";

const emptyClientForm: ClientePayload = {
  clientName: "",
  companyName: "",
  mailboxNumber: "",
  whatsapp: "",
};

const buildClientPayload = (form: ClientePayload): ClientePayload => ({
  clientName: form.clientName.trim(),
  companyName: form.companyName.trim(),
  mailboxNumber: form.mailboxNumber.trim(),
  whatsapp: form.whatsapp?.trim() || null,
});

interface ClientSearchCardProps {
  selectedClient: Cliente | null;
  onSelectClient: (cliente: Cliente) => void;
  onClientSaved?: (cliente: Cliente) => void;
  onRegisterPackage: () => void;
  isRegisteringPackage: boolean;
}

const ClientSearchCard = ({
  selectedClient,
  onSelectClient,
  onClientSaved,
  onRegisterPackage,
  isRegisteringPackage,
}: ClientSearchCardProps) => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);
  const [clientFormMode, setClientFormMode] = useState<ClientFormMode>("create");
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [clientForm, setClientForm] = useState<ClientePayload>(emptyClientForm);
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

  const createClientMutation = useMutation({
    mutationFn: (payload: ClientePayload) => apiPost<Cliente, ClientePayload>("/clientes", payload),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClientePayload }) =>
      apiPut<Cliente, ClientePayload>(`/clientes/${id}`, payload),
  });

  const isSavingClient = createClientMutation.isPending || updateClientMutation.isPending;

  useEffect(() => {
    if (!selectedClient) {
      return;
    }

    setQuery(selectedClient.clientName);
  }, [selectedClient]);

  const openCreateClientForm = () => {
    setClientForm({
      ...emptyClientForm,
      clientName: query.trim(),
    });
    setClientFormMode("create");
    setIsClientFormOpen(true);
    setIsListOpen(false);
  };

  const openEditClientForm = () => {
    if (!selectedClient) {
      return;
    }

    setClientForm({
      clientName: selectedClient.clientName,
      companyName: selectedClient.companyName,
      mailboxNumber: selectedClient.mailboxNumber,
      whatsapp: selectedClient.whatsapp ?? "",
    });
    setClientFormMode("edit");
    setIsClientFormOpen(true);
    setIsListOpen(false);
  };

  const handleClientFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (clientFormMode === "edit" && !selectedClient) {
      return;
    }

    const payload = buildClientPayload(clientForm);

    if (!payload.clientName || !payload.companyName || !payload.mailboxNumber) {
      toast({
        title: "Dados obrigatorios",
        description: "Preencha nome do cliente, empresa e caixa postal.",
        variant: "destructive",
      });
      return;
    }

    try {
      const savedClient =
        clientFormMode === "create"
          ? await createClientMutation.mutateAsync(payload)
          : await updateClientMutation.mutateAsync({ id: selectedClient!.id, payload });

      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      onSelectClient(savedClient);
      onClientSaved?.(savedClient);
      setQuery(savedClient.clientName);
      setIsClientFormOpen(false);

      toast({
        title: clientFormMode === "create" ? "Cliente cadastrado" : "Cliente atualizado",
        description: `${savedClient.clientName} esta selecionado(a) para a encomenda.`,
      });
    } catch {
      toast({
        title: clientFormMode === "create" ? "Erro ao cadastrar cliente" : "Erro ao editar cliente",
        description: "Nao foi possivel salvar os dados do cliente na API.",
        variant: "destructive",
      });
    }
  };

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
              <div className="py-2">
                <p className="px-4 py-2 text-sm text-muted-foreground">
                  Nenhum cliente encontrado com esse termo.
                </p>
                <button
                  type="button"
                  onClick={openCreateClientForm}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-surface-2"
                >
                  <Plus className="h-4 w-4" />
                  + Cadastrar novo cliente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedClient && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-2 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={openEditClientForm}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar cliente
          </Button>
        </div>
      )}

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

      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {clientFormMode === "create" ? "Cadastrar novo cliente" : "Editar cliente"}
            </DialogTitle>
            <DialogDescription>
              {clientFormMode === "create"
                ? "Informe os dados para criar um cliente e seleciona-lo."
                : "Atualize o cadastro existente sem criar duplicidade."}
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleClientFormSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="clientName">Nome do cliente</Label>
              <Input
                id="clientName"
                value={clientForm.clientName}
                onChange={(event) =>
                  setClientForm((currentForm) => ({ ...currentForm, clientName: event.target.value }))
                }
                maxLength={100}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyName">Empresa</Label>
              <Input
                id="companyName"
                value={clientForm.companyName}
                onChange={(event) =>
                  setClientForm((currentForm) => ({ ...currentForm, companyName: event.target.value }))
                }
                maxLength={100}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mailboxNumber">Caixa postal</Label>
              <Input
                id="mailboxNumber"
                value={clientForm.mailboxNumber}
                onChange={(event) =>
                  setClientForm((currentForm) => ({ ...currentForm, mailboxNumber: event.target.value }))
                }
                maxLength={50}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={clientForm.whatsapp ?? ""}
                onChange={(event) =>
                  setClientForm((currentForm) => ({ ...currentForm, whatsapp: event.target.value }))
                }
                maxLength={30}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsClientFormOpen(false)}
                disabled={isSavingClient}
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isSavingClient}>
                {isSavingClient && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
