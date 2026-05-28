import { useEffect, useMemo, useState } from "react";
import { Package as PackageIcon, Clock, Send, AlertTriangle } from "lucide-react";

import DashboardHeader from "@/components/DashboardHeader";
import ClientSearchCard from "@/components/ClientSearchCard";
import MetricCard from "@/components/MetricCard";
import PackageTable from "@/components/PackageTable";
import PackageDetail from "@/components/PackageDetail";
import RecentEvents from "@/components/RecentEvents";
import { packages, Package } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { apiDelete, apiGet, apiPatch, apiPostForm } from "@/lib/api";
import type { Cliente } from "@/types/cliente";

const POLLING_INTERVAL_MS = 10000;

interface ApiEncomenda {
  id: number;
  descricao: string;
  observacao: string | null;
  observacaoAtualizadaPor: string | null;
  observacaoAtualizadaEm: string | null;
  auditoriaObservacoes?: ApiObservationAudit[];
  status: string;
  dataRecebimento: string;
  dataEntrega: string | null;
  urlFoto: string | null;
  recebidoPor: string | null;
  marcadoEnviadoPor: string | null;
  cliente: {
    id: number;
    clientName: string;
    companyName: string;
    mailboxNumber: string;
    whatsapp: string | null;
  };
}

interface ApiObservationAudit {
  id: number;
  usuario: string;
  valorAntigo: string | null;
  valorNovo: string | null;
  dataHora: string;
  acao: string;
}

interface UpdateObservationRequest {
  observacao: string;
  usuario: string;
  funcionario: string;
  nomeUsuario: string;
  atualizadoPor: string;
  usuarioId?: string;
  username?: string;
  role?: string;
}

const formatPackageTime = (value: string) => {
  const directTimeMatch = value.match(/T(\d{2}:\d{2})/);

  if (directTimeMatch) {
    return directTimeMatch[1];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapApiStatusToPackageStatus = (status: string): Package["status"] => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "entregue") {
    return "enviado";
  }

  if (normalizedStatus === "pendente") {
    return "pendente";
  }

  return "atrasado";
};

const mapEncomendaToPackage = (encomenda: ApiEncomenda): Package => ({
  id: encomenda.id,
  backendId: encomenda.id,
  clientId: encomenda.cliente.id,
  origin: "api",
  dataRecebimento: encomenda.dataRecebimento,
  dataEntrega: encomenda.dataEntrega || undefined,
  cliente: encomenda.cliente.clientName,
  sala: encomenda.cliente.mailboxNumber || "-",
  empresa: encomenda.cliente.companyName || "Empresa nao informada",
  horario: formatPackageTime(encomenda.dataRecebimento),
  status: mapApiStatusToPackageStatus(encomenda.status),
  funcionario: encomenda.marcadoEnviadoPor || encomenda.recebidoPor || "Nao informado",
  descricao: encomenda.descricao || "Encomenda cadastrada na API.",
  observacoes: encomenda.observacao || undefined,
  observacaoAtualizadaPor: encomenda.observacaoAtualizadaPor || undefined,
  observacaoAtualizadaEm: encomenda.observacaoAtualizadaEm || undefined,
  auditoriaObservacoes: encomenda.auditoriaObservacoes ?? [],
  recebidoPor: encomenda.recebidoPor || "Nao informado",
  whatsapp: encomenda.cliente.whatsapp || "",
  marcadoEnviadoPor: encomenda.marcadoEnviadoPor || undefined,
  textoAuxiliar: `Dados restaurados da API para a encomenda ${encomenda.id}.`,
});

const canUserViewObservationHistory = (user: {
  role: string;
  isAdmin?: boolean;
  canViewHistory?: boolean;
  canViewObservationHistory?: boolean;
} | null) =>
  !!user?.canViewObservationHistory ||
  !!user?.canViewHistory ||
  !!user?.isAdmin ||
  user?.role?.trim().toUpperCase() === "ROLE_ADMIN";

const appendCurrentUserParams = (
  path: string,
  user: { id: number; name: string; email: string; role: string } | null
) => {
  if (!user) {
    return path;
  }

  const [basePath, queryString = ""] = path.split("?");
  const params = new URLSearchParams(queryString);
  params.set("usuario", user.name);
  params.set("usuarioId", String(user.id));
  params.set("username", user.email);
  params.set("role", user.role);

  return `${basePath}?${params.toString()}`;
};

const sortPackages = (items: Package[]) =>
  [...items].sort((left, right) => {
    const rightKey = right.backendId ?? right.id;
    const leftKey = left.backendId ?? left.id;
    return rightKey - leftKey;
  });

const mergeFrontendFields = (currentPackages: Package[], nextPackages: Package[]) => {
  const currentPackagesById = new Map(currentPackages.map((pkg) => [pkg.id, pkg]));

  return nextPackages.map((pkg) => {
    const currentPackage = currentPackagesById.get(pkg.id);

    if (!currentPackage) {
      return pkg;
    }

    return {
      ...pkg,
      observacoes: pkg.observacoes ?? currentPackage.observacoes,
      observacaoAtualizadaPor: pkg.observacaoAtualizadaPor ?? currentPackage.observacaoAtualizadaPor,
      observacaoAtualizadaEm: pkg.observacaoAtualizadaEm ?? currentPackage.observacaoAtualizadaEm,
      auditoriaObservacoes: pkg.auditoriaObservacoes ?? currentPackage.auditoriaObservacoes,
      codigoRastreio: currentPackage.codigoRastreio,
      textoAuxiliar: currentPackage.textoAuxiliar,
    };
  });
};

const buildPersistedDescription = (cliente: Cliente) =>
  `Encomenda cadastrada para ${cliente.clientName} - ${cliente.companyName || "Empresa nao informada"}.`;

const Index = () => {
  const { user } = useAuth();
  const employeeName = user?.name?.trim() || "Atendente";
  const canViewObservationHistory = canUserViewObservationHistory(user);
  const [packageList, setPackageList] = useState<Package[]>(packages);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(packages[0]?.id ?? null);
  const [isRegisteringPackage, setIsRegisteringPackage] = useState(false);
  const selectedPackage = packageList.find((pkg) => pkg.id === selectedPackageId) ?? null;
  const metrics = useMemo(() => {
    const today = new Date().toLocaleDateString("pt-BR");
    const packagesToday = packageList.filter((pkg) => {
      if (!pkg.dataRecebimento) {
        return true;
      }

      const receivedDate = new Date(pkg.dataRecebimento);

      if (Number.isNaN(receivedDate.getTime())) {
        return true;
      }

      return receivedDate.toLocaleDateString("pt-BR") === today;
    });

    return [
      { title: "Encomendas hoje", value: packagesToday.length, icon: PackageIcon, accentBg: "bg-eva-red-light", accentText: "text-primary", accentIcon: "text-primary" },
      { title: "Comunicadas", value: packageList.filter((pkg) => pkg.status === "pendente").length, icon: Clock, accentBg: "bg-eva-warning-light", accentText: "text-eva-warning", accentIcon: "text-eva-warning" },
      { title: "Entregues", value: packageList.filter((pkg) => pkg.status === "enviado").length, icon: Send, accentBg: "bg-eva-green-light", accentText: "text-eva-green", accentIcon: "text-eva-green" },
      { title: "Atrasadas", value: packageList.filter((pkg) => pkg.status === "atrasado").length, icon: AlertTriangle, accentBg: "bg-eva-danger-light", accentText: "text-eva-danger", accentIcon: "text-eva-danger" },
    ];
  }, [packageList]);

  useEffect(() => {
    let isMounted = true;
    let pollingId: ReturnType<typeof setInterval> | null = null;

    const loadPackages = async () => {
      try {
        const apiPackages = await apiGet<ApiEncomenda[]>(appendCurrentUserParams("/encomendas", user));
        if (!isMounted) {
          return;
        }

        const mappedPackages = sortPackages(apiPackages.map(mapEncomendaToPackage));
        console.log("role usuario logado", user?.role, {
          isAdmin: user?.isAdmin,
          canViewObservationHistory,
        });
        console.log(
          "auditoriaObservacoes recebidas",
          mappedPackages.map((pkg) => ({
            id: pkg.id,
            tamanho: pkg.auditoriaObservacoes?.length ?? 0,
            auditoria: pkg.auditoriaObservacoes ?? [],
          }))
        );
        setPackageList((currentPackages) => mergeFrontendFields(currentPackages, mappedPackages));
        setSelectedPackageId((currentSelectedId) => {
          if (currentSelectedId && mappedPackages.some((pkg) => pkg.id === currentSelectedId)) {
            return currentSelectedId;
          }

          return mappedPackages[0]?.id ?? null;
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setPackageList((currentPackages) => currentPackages);
        setSelectedPackageId((currentSelectedId) => currentSelectedId ?? packages[0]?.id ?? null);
      }
    };

    void loadPackages();
    pollingId = setInterval(() => {
      void loadPackages();
    }, POLLING_INTERVAL_MS);

    return () => {
      isMounted = false;
      if (pollingId) {
        clearInterval(pollingId);
      }
    };
  }, [user, canViewObservationHistory]);

  useEffect(() => {
    if (!canViewObservationHistory || !selectedPackage?.backendId) {
      return;
    }

    let isMounted = true;

    const loadObservationAudit = async () => {
      try {
        const auditoriaObservacoes = await apiGet<ApiObservationAudit[]>(
          appendCurrentUserParams(`/encomendas/${selectedPackage.backendId}/observacoes/auditoria`, user)
        );

        if (!isMounted) {
          return;
        }

        console.log("auditoria", auditoriaObservacoes);
        console.log("tamanho auditoria", auditoriaObservacoes.length);
        console.log("role usuario logado", user?.role, {
          isAdmin: user?.isAdmin,
          canViewObservationHistory,
        });

        setPackageList((currentPackages) =>
          currentPackages.map((currentPackage) =>
            currentPackage.id === selectedPackage.id
              ? {
                  ...currentPackage,
                  auditoriaObservacoes,
                }
              : currentPackage
          )
        );
      } catch (error) {
        console.log("auditoria", []);
        console.log("tamanho auditoria", 0);
        console.log("role usuario logado", user?.role, {
          isAdmin: user?.isAdmin,
          canViewObservationHistory,
          erro: error instanceof Error ? error.message : "erro desconhecido",
        });
      }
    };

    void loadObservationAudit();

    return () => {
      isMounted = false;
    };
  }, [
    canViewObservationHistory,
    selectedPackage?.backendId,
    selectedPackage?.id,
    user,
  ]);

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackageId(pkg.id);
  };

  const handleSelectClient = (cliente: Cliente) => {
    setSelectedClient(cliente);
  };

  const handleClientSaved = (cliente: Cliente) => {
    setSelectedClient(cliente);
    setPackageList((currentPackages) =>
      currentPackages.map((pkg) =>
        pkg.clientId === cliente.id
          ? {
              ...pkg,
              cliente: cliente.clientName,
              empresa: cliente.companyName || "Empresa nao informada",
              sala: cliente.mailboxNumber || "-",
              whatsapp: cliente.whatsapp || "",
            }
          : pkg
      )
    );
  };

  const handleRegisterPackage = async () => {
    if (!selectedClient || isRegisteringPackage) {
      return;
    }

    const formData = new FormData();
    formData.append("clienteId", String(selectedClient.id));
    formData.append("descricao", buildPersistedDescription(selectedClient));
    formData.append("recebidoPor", employeeName);
    formData.append(
      "arquivo",
      new Blob(
        [`Cadastro inicial da encomenda para ${selectedClient.clientName} em ${new Date().toISOString()}.`],
        { type: "text/plain" }
      ),
      "cadastro-inicial.txt"
    );

    setIsRegisteringPackage(true);

    try {
      const persistedPackage = mapEncomendaToPackage(await apiPostForm<ApiEncomenda>("/encomendas", formData));
      const enrichedPackage: Package = {
        ...persistedPackage,
        funcionario: employeeName,
        recebidoPor: employeeName,
        textoAuxiliar: "Encomenda salva na API e pronta para acompanhamento.",
      };

      setPackageList((currentPackages) => sortPackages([enrichedPackage, ...currentPackages]));
      setSelectedPackageId(enrichedPackage.id);

      toast({
        title: "Encomenda cadastrada",
        description: `${selectedClient.clientName} foi persistido(a) na API com sucesso.`,
      });
    } catch {
      toast({
        title: "Erro ao cadastrar",
        description: "Nao foi possivel salvar a encomenda na API. Nenhum registro local temporario foi mantido.",
        variant: "destructive",
      });
    } finally {
      setIsRegisteringPackage(false);
    }
  };

  const handleMarkAsSent = async (pkg: Package) => {
    if (pkg.origin === "api" && pkg.backendId) {
      try {
        const updatedFromApi = mapEncomendaToPackage(
          await apiPatch<ApiEncomenda>(
            `/encomendas/${pkg.backendId}/entregar?marcadoEnviadoPor=${encodeURIComponent(employeeName)}`
          )
        );
        const enrichedUpdatedPackage: Package = {
          ...updatedFromApi,
          funcionario: employeeName,
          recebidoPor: pkg.recebidoPor || updatedFromApi.recebidoPor || employeeName,
          whatsapp: pkg.whatsapp || updatedFromApi.whatsapp,
          observacoes: updatedFromApi.observacoes ?? pkg.observacoes,
          observacaoAtualizadaPor: updatedFromApi.observacaoAtualizadaPor ?? pkg.observacaoAtualizadaPor,
          observacaoAtualizadaEm: updatedFromApi.observacaoAtualizadaEm ?? pkg.observacaoAtualizadaEm,
          auditoriaObservacoes: updatedFromApi.auditoriaObservacoes ?? pkg.auditoriaObservacoes,
          codigoRastreio: pkg.codigoRastreio,
          marcadoEnviadoPor: employeeName,
          textoAuxiliar: `Encomenda marcada como enviada por ${employeeName} e persistida na API.`,
        };

        setPackageList((currentPackages) =>
          currentPackages.map((currentPackage) =>
            currentPackage.id === enrichedUpdatedPackage.id ? enrichedUpdatedPackage : currentPackage
          )
        );
        setSelectedPackageId(enrichedUpdatedPackage.id);

        toast({
          title: "Encomenda atualizada",
          description: `${enrichedUpdatedPackage.cliente} foi marcada como enviada e persistida na API.`,
        });
        return;
      } catch {
        toast({
          title: "Erro ao atualizar",
          description: "Nao foi possivel persistir a entrega desta encomenda na API.",
          variant: "destructive",
        });
        return;
      }
    }

    const updatedPackage: Package = {
      ...pkg,
      status: "enviado",
      funcionario: employeeName,
      marcadoEnviadoPor: employeeName,
      textoAuxiliar: `Encomenda marcada como enviada por ${employeeName}.`,
    };

    setPackageList((currentPackages) =>
      currentPackages.map((currentPackage) =>
        currentPackage.id === updatedPackage.id ? updatedPackage : currentPackage
      )
    );
    setSelectedPackageId(updatedPackage.id);

    toast({
      title: "Encomenda atualizada",
      description: `${updatedPackage.cliente} foi marcada como enviada no front.`,
    });
  };

  const handleSaveObservation = async (pkg: Package, observacoes: string) => {
    if (pkg.origin === "api" && pkg.backendId) {
      try {
        const updatedFromApi = mapEncomendaToPackage(
          await apiPatch<ApiEncomenda, UpdateObservationRequest>(`/encomendas/${pkg.backendId}/observacao`, {
            observacao: observacoes,
            usuario: employeeName,
            funcionario: employeeName,
            nomeUsuario: employeeName,
            atualizadoPor: employeeName,
            usuarioId: user?.id ? String(user.id) : undefined,
            username: user?.email,
            role: user?.role,
          })
        );
        const enrichedUpdatedPackage: Package = {
          ...updatedFromApi,
          funcionario: pkg.funcionario,
          recebidoPor: pkg.recebidoPor || updatedFromApi.recebidoPor,
          whatsapp: pkg.whatsapp || updatedFromApi.whatsapp,
          codigoRastreio: pkg.codigoRastreio,
          fotoEnviadaPor: pkg.fotoEnviadaPor,
          marcadoEnviadoPor: pkg.marcadoEnviadoPor || updatedFromApi.marcadoEnviadoPor,
          observacaoAtualizadaPor: updatedFromApi.observacaoAtualizadaPor ?? employeeName,
          observacaoAtualizadaEm: updatedFromApi.observacaoAtualizadaEm,
          auditoriaObservacoes: updatedFromApi.auditoriaObservacoes ?? pkg.auditoriaObservacoes,
          textoAuxiliar: pkg.textoAuxiliar,
        };

        setPackageList((currentPackages) =>
          currentPackages.map((currentPackage) =>
            currentPackage.id === enrichedUpdatedPackage.id ? enrichedUpdatedPackage : currentPackage
          )
        );
        setSelectedPackageId(enrichedUpdatedPackage.id);

        toast({
          title: "Observacao salva",
          description: "A observacao da encomenda foi persistida com sucesso.",
        });
        return;
      } catch {
        toast({
          title: "Erro ao salvar observacao",
          description: "Nao foi possivel persistir a observacao desta encomenda na API.",
          variant: "destructive",
        });
        return;
      }
    }

    const updatedPackage: Package = {
      ...pkg,
      observacoes,
      observacaoAtualizadaPor: employeeName,
      observacaoAtualizadaEm: new Date().toISOString(),
      auditoriaObservacoes: [
        {
          id: Date.now(),
          usuario: employeeName,
          valorAntigo: pkg.observacoes ?? null,
          valorNovo: observacoes,
          dataHora: new Date().toISOString(),
          acao: pkg.observacoes ? "OBSERVACAO_ALTERADA" : "OBSERVACAO_CRIADA",
        },
        ...(pkg.auditoriaObservacoes ?? []),
      ],
    };

    setPackageList((currentPackages) =>
      currentPackages.map((currentPackage) =>
        currentPackage.id === updatedPackage.id ? updatedPackage : currentPackage
      )
    );
    setSelectedPackageId(updatedPackage.id);

    toast({
      title: "Observacao salva",
      description: "A observacao da encomenda foi atualizada com sucesso.",
    });
  };

  const handleDeletePackage = (pkg: Package) => {
    const shouldDelete = window.confirm("Tem certeza que deseja excluir esta encomenda?");

    if (!shouldDelete) {
      return;
    }

    const removePackageFromUi = () => {
      setPackageList((currentPackages) => {
        const nextPackages = currentPackages.filter((currentPackage) => currentPackage.id !== pkg.id);

        setSelectedPackageId((currentSelectedId) => {
          if (currentSelectedId !== pkg.id) {
            return currentSelectedId;
          }

          return nextPackages[0]?.id ?? null;
        });

        return nextPackages;
      });
    };

    if (pkg.origin === "api" && pkg.backendId) {
      void (async () => {
        try {
          await apiDelete(`/encomendas/${pkg.backendId}`);
          removePackageFromUi();

          toast({
            title: "Encomenda removida",
            description: `${pkg.cliente} foi excluido(a) com sucesso.`,
          });
        } catch {
          toast({
            title: "Erro ao excluir",
            description: "Nao foi possivel excluir esta encomenda na API.",
            variant: "destructive",
          });
        }
      })();

      return;
    }

    removePackageFromUi();

    toast({
      title: "Encomenda removida",
      description: `${pkg.cliente} foi removido(a) da lista atual.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-4 flex flex-col gap-4">
        <DashboardHeader />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={m.title} {...m} delay={i * 0.1} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <PackageTable
              packages={packageList}
              selectedId={selectedPackageId}
              onSelect={handleSelectPackage}
              onDelete={handleDeletePackage}
            />
            <RecentEvents packages={packageList} />
          </div>
          <div className="flex flex-col gap-4">
            <ClientSearchCard
              selectedClient={selectedClient}
              onSelectClient={handleSelectClient}
              onClientSaved={handleClientSaved}
              onRegisterPackage={handleRegisterPackage}
              isRegisteringPackage={isRegisteringPackage}
            />
            <PackageDetail
              pkg={selectedPackage}
              onMarkAsSent={handleMarkAsSent}
              onSaveObservation={handleSaveObservation}
              canViewObservationHistory={canViewObservationHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
