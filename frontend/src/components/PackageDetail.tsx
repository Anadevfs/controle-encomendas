import { useEffect, useRef, useState } from "react";

import { Package, PackageObservationAudit } from "@/data/mockData";
import { Camera, CheckCircle2, RefreshCw, User, Building2, Clock, Info, UserCheck, ImageIcon, Send, Phone, ScanLine, History, Save, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";

const statusConfig = {
  enviado: { label: "Enviado", bgClass: "bg-eva-green-light", textClass: "text-eva-green", borderClass: "border-eva-green/30" },
  pendente: { label: "Pendente", bgClass: "bg-eva-warning-light", textClass: "text-eva-warning", borderClass: "border-eva-warning/30" },
  atrasado: { label: "Atrasado", bgClass: "bg-eva-danger-light", textClass: "text-eva-danger", borderClass: "border-eva-danger/30" },
};

interface PackageDetailProps {
  pkg: Package | null;
  onMarkAsSent: (pkg: Package) => void;
  onSaveTrackingCode: (pkg: Package, codigoRastreio: string) => void;
  onSaveObservation: (pkg: Package, observacao: string) => void;
  canViewObservationHistory: boolean;
  onLoadObservationHistory: (pkg: Package) => Promise<PackageObservationAudit[]>;
}

const PackageDetail = ({
  pkg,
  onMarkAsSent,
  onSaveTrackingCode,
  onSaveObservation,
  canViewObservationHistory,
  onLoadObservationHistory,
}: PackageDetailProps) => {
  const [trackingInput, setTrackingInput] = useState("");
  const [observationInput, setObservationInput] = useState("");
  const [showObservationHistory, setShowObservationHistory] = useState(false);
  const [isLoadingObservationHistory, setIsLoadingObservationHistory] = useState(false);
  const [observationAudits, setObservationAudits] = useState<PackageObservationAudit[]>([]);
  const scannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!pkg) {
      setTrackingInput("");
      setObservationInput("");
      setShowObservationHistory(false);
      setObservationAudits([]);
      return;
    }

    setTrackingInput(pkg.codigoRastreio ?? "");
    setObservationInput(pkg.observacao ?? "");
    setShowObservationHistory(false);
    setObservationAudits(pkg.auditoriaObservacoes ?? []);
    scannerInputRef.current?.focus();
  }, [pkg?.id]);

  if (!pkg) {
    return (
      <div className="eva-card-elevated rounded-2xl p-6 flex flex-col items-center justify-center min-h-[500px]">
        <Info className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm text-center">
          Selecione uma encomenda para ver os detalhes
        </p>
      </div>
    );
  }

  const cfg = statusConfig[pkg.status];
  const codigoRastreioSalvo = pkg.codigoRastreio?.trim() ?? "";
  const receivedAtLabel = pkg.horario.split(" / ")[0];
  const observacaoSalva = pkg.observacao?.trim() ?? "";

  const handleTrackingSubmit = () => {
    const normalizedCode = trackingInput.trim();

    if (!normalizedCode) {
      scannerInputRef.current?.focus();
      return;
    }

    if (normalizedCode === codigoRastreioSalvo) {
      setTrackingInput("");
      scannerInputRef.current?.focus();
      return;
    }

    onSaveTrackingCode(pkg, normalizedCode);
    setTrackingInput("");
    scannerInputRef.current?.focus();
  };

  const handleObservationSubmit = () => {
    const normalizedObservation = observationInput.trim();

    if (normalizedObservation === observacaoSalva) {
      return;
    }

    onSaveObservation(pkg, normalizedObservation);
  };

  const handleObservationHistoryToggle = async () => {
    if (showObservationHistory) {
      setShowObservationHistory(false);
      return;
    }

    setIsLoadingObservationHistory(true);
    const audits = await onLoadObservationHistory(pkg);
    setObservationAudits(audits);
    setShowObservationHistory(true);
    setIsLoadingObservationHistory(false);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pkg.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="eva-card-elevated rounded-2xl p-6 flex flex-col gap-5"
      >
        <div className="flex items-center gap-3">
          <div className="h-1 w-5 rounded-full bg-primary" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Detalhes da Encomenda</p>
            <h3 className="font-heading text-xl font-bold text-foreground">{pkg.cliente}</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DetailItem icon={Building2} label="Empresa" value={pkg.empresa} />
          <DetailItem icon={User} label="Caixa Postal" value={pkg.sala} />
          <DetailItem icon={Clock} label="Recebido" value={receivedAtLabel} />
          <DetailItem icon={Phone} label="WhatsApp" value={pkg.whatsapp || "Nao informado"} />
          <div className="flex items-start gap-2.5">
            <div className="rounded-lg bg-eva-red-light p-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
              <span className={`inline-block mt-0.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}>
                {cfg.label}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-3">{pkg.descricao}</p>
        {pkg.textoAuxiliar && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
            {pkg.textoAuxiliar}
          </p>
        )}

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Codigo de Rastreio
            </p>
            <button
              type="button"
              onClick={() => scannerInputRef.current?.focus()}
              className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-3"
            >
              <ScanLine className="h-3.5 w-3.5" />
              Escanear codigo
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              ref={scannerInputRef}
              type="text"
              value={trackingInput}
              autoFocus
              placeholder="Aproxime o leitor ou digite o codigo"
              className="h-11 rounded-xl border-border bg-surface-2"
              onChange={(event) => setTrackingInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleTrackingSubmit();
                }
              }}
            />

            <div className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
              {codigoRastreioSalvo
                ? `Codigo salvo: ${codigoRastreioSalvo}`
                : "Nenhum codigo registrado para esta encomenda."}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Rastreabilidade
          </p>
          <div className="space-y-2">
            <TraceItem icon={UserCheck} label="Comunicada por" value={pkg.recebidoPor} />
            <div className="rounded-lg bg-surface-2 px-3 py-3">
              <div className="mb-2 flex items-center gap-2.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Observacao:</span>
              </div>
              <textarea
                value={observationInput}
                onChange={(event) => setObservationInput(event.target.value)}
                rows={3}
                placeholder="Registrar observacao da encomenda"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleObservationSubmit}
                  disabled={observationInput.trim() === observacaoSalva}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-eva-red-dark disabled:cursor-default disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  Salvar observacao
                </button>
              </div>
            </div>
            {pkg.observacaoAtualizadaPor && (
              <TraceItem
                icon={Save}
                label="Salva por"
                value={formatSavedBy(pkg.observacaoAtualizadaPor, pkg.observacaoAtualizadaEm)}
              />
            )}
            {canViewObservationHistory && (
              <div className="rounded-lg bg-surface-2 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <History className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-semibold text-foreground">Historico de observacoes</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleObservationHistoryToggle}
                    disabled={isLoadingObservationHistory}
                    className="text-xs font-semibold text-primary transition-colors hover:text-eva-red-dark"
                  >
                    {showObservationHistory ? "Ocultar historico" : isLoadingObservationHistory ? "Carregando" : "Ver historico"}
                  </button>
                </div>
                {showObservationHistory && observationAudits.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-border pt-3">
                    {observationAudits.map((audit, index) => (
                      <li key={`${audit.dataHora}-${index}`} className="text-xs leading-relaxed text-muted-foreground">
                        {formatObservationAudit(audit)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {pkg.fotoEnviadaPor && (
              <TraceItem icon={ImageIcon} label="Foto enviada por" value={pkg.fotoEnviadaPor} />
            )}
            {pkg.marcadoEnviadoPor && (
              <TraceItem icon={Send} label="Entregue por" value={pkg.marcadoEnviadoPor} />
            )}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Controle da Encomenda
          </p>

          <div className="flex flex-col gap-3">
            <button className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 px-4 text-sm transition-all duration-200 hover:bg-eva-red-dark eva-glow-red hover:scale-[1.02] active:scale-[0.98]">
              <Camera className="h-4 w-4" />
              Enviar foto
            </button>

            <button
              onClick={() => onMarkAsSent(pkg)}
              disabled={pkg.status === "enviado"}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-200 ${
                pkg.status === "enviado"
                  ? "cursor-default border border-eva-green/30 bg-eva-green-light text-eva-green"
                  : "bg-eva-green text-primary-foreground hover:opacity-90 eva-glow-green hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {pkg.status === "enviado" ? "Encomenda enviada" : "Marcar como enviada"}
            </button>

            <button
              disabled
              className="flex items-center justify-center gap-2 rounded-xl bg-surface-3 border border-border text-muted-foreground/50 font-semibold py-3 px-4 text-sm cursor-not-allowed"
            >
              <RefreshCw className="h-4 w-4" />
              Reenviar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const DetailItem = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-start gap-2.5">
    <div className="rounded-lg bg-eva-red-light p-1.5">
      <Icon className="h-3.5 w-3.5 text-primary" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

const TraceItem = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-3 py-2">
    <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
    <span className="text-xs text-muted-foreground">{label}:</span>
    <span className="text-xs font-semibold text-foreground">{value}</span>
  </div>
);

const formatAuditDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--/-- --:--";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
};

const formatSavedBy = (usuario: string, dataHora?: string) =>
  dataHora ? `${usuario} em ${formatAuditDateTime(dataHora)}` : usuario;

const quoteValue = (value: string | null) => `"${value || ""}"`;

const formatObservationAudit = (audit: PackageObservationAudit) => {
  const dateTime = formatAuditDateTime(audit.dataHora);

  if (audit.acao === "OBSERVACAO_CRIADA") {
    return `${dateTime} · ${audit.usuario} criou observacao: ${quoteValue(audit.valorNovo)}`;
  }

  return `${dateTime} · ${audit.usuario} alterou de ${quoteValue(audit.valorAntigo)} para ${quoteValue(audit.valorNovo)}`;
};

export default PackageDetail;
