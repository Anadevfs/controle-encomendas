import { useEffect, useState } from "react";
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

const metrics = [
  { title: "Encomendas hoje", value: 8, icon: PackageIcon, accentBg: "bg-eva-red-light", accentText: "text-primary", accentIcon: "text-primary" },
  { title: "Pendentes de envio", value: 3, icon: Clock, accentBg: "bg-eva-warning-light", accentText: "text-eva-warning", accentIcon: "text-eva-warning" },
  { title: "Enviadas", value: 3, icon: Send, accentBg: "bg-eva-green-light", accentText: "text-eva-green", accentIcon: "text-eva-green" },
  { title: "Atrasadas", value: 2, icon: AlertTriangle, accentBg: "bg-eva-danger-light", accentText: "text-eva-danger", accentIcon: "text-eva-danger" },
];

interface ApiEncomenda {
  id: number;
  descricao: string;
  status: string;
  dataRecebimento: string;
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

const formatPackageTime = (value: string) => {
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
  cliente: encomenda.cliente.clientName,
  sala: encomenda.cliente.mailboxNumber || "-",
  empresa: encomenda.cliente.companyName || "Empresa nao informada",
  horario: formatPackageTime(encomenda.dataRecebimento),
  status: mapApiStatusToPackageStatus(encomenda.status),
  funcionario: encomenda.marcadoEnviadoPor || encomenda.recebidoPor || "Nao informado",
  descricao: encomenda.descricao || "Encomenda cadastrada na API.",
  recebidoPor: encomenda.recebidoPor || "Nao informado",
  whatsapp: encomenda.cliente.whatsapp || "",
  marcadoEnviadoPor: encomenda.marcadoEnviadoPor || undefined,
  textoAuxiliar: `Dados restaurados da API para a encomenda ${encomenda.id}.`,
});

const sortPackages = (items: Package[]) =>
  [...items].sort((left, right) => {
    const rightKey = right.backendId ?? right.id;
    const leftKey = left.backendId ?? left.id;
    return rightKey - leftKey;
  });

const buildPersistedDescription = (cliente: Cliente) =>
  `Encomenda cadastrada para ${cliente.clientName} - ${cliente.companyName || "Empresa nao informada"}.`;

const Index = () => {
  const { user } = useAuth();
  const employeeName = user?.name ?? "Atendente";
  const [packageList, setPackageList] = useState<Package[]>(packages);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(packages[0]?.id ?? null);
  const selectedPackage = packageList.find((pkg) => pkg.id === selectedPackageId) ?? null;

  useEffect(() => {
    let isMounted = true;

    const loadPackages = async () => {
      try {
        const apiPackages = await apiGet<ApiEncomenda[]>("/encomendas");
        if (!isMounted) {
          return;
        }

        const mappedPackages = sortPackages(apiPackages.map(mapEncomendaToPackage));
        setPackageList(mappedPackages);
        setSelectedPackageId(mappedPackages[0]?.id ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setPackageList(packages);
        setSelectedPackageId((currentSelectedId) => currentSelectedId ?? packages[0]?.id ?? null);
      }
    };

    void loadPackages();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackageId(pkg.id);
  };

  const handleSelectClient = async (cliente: Cliente) => {
    setSelectedClient(cliente);

    const latestPersistedPackage = packageList.find(
      (pkg) => pkg.origin === "api" && pkg.clientId === cliente.id
    );

    if (latestPersistedPackage) {
      setPackageList((currentPackages) =>
        currentPackages.map((currentPackage) =>
          currentPackage.id === latestPersistedPackage.id
            ? {
                ...currentPackage,
                textoAuxiliar:
                  latestPersistedPackage.status === "enviado"
                    ? latestPersistedPackage.textoAuxiliar ||
                      "Encomenda persistida na API e ja marcada como enviada."
                    : "Encomenda persistida na API e pronta para acompanhamento.",
              }
            : currentPackage
        )
      );
      setSelectedPackageId(latestPersistedPackage.id);
      return;
    }

    const formData = new FormData();
    formData.append("clienteId", String(cliente.id));
    formData.append("descricao", buildPersistedDescription(cliente));
    formData.append("recebidoPor", employeeName);
    formData.append(
      "arquivo",
      new Blob(
        [`Cadastro inicial da encomenda para ${cliente.clientName} em ${new Date().toISOString()}.`],
        { type: "text/plain" }
      ),
      "cadastro-inicial.txt"
    );

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
        description: `${cliente.clientName} foi persistido(a) na API com sucesso.`,
      });
    } catch {
      toast({
        title: "Erro ao cadastrar",
        description: "Nao foi possivel salvar a encomenda na API. Nenhum registro local temporario foi mantido.",
        variant: "destructive",
      });
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
          observacoes: pkg.observacoes,
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

  const handleObservationChange = (pkg: Package, observacoes: string) => {
    const updatedPackage: Package = {
      ...pkg,
      observacoes,
    };

    setPackageList((currentPackages) =>
      currentPackages.map((currentPackage) =>
        currentPackage.id === updatedPackage.id ? updatedPackage : currentPackage
      )
    );
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
            <ClientSearchCard selectedClient={selectedClient} onSelectClient={handleSelectClient} />
            <PackageDetail
              pkg={selectedPackage}
              onMarkAsSent={handleMarkAsSent}
              onObservationChange={handleObservationChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
