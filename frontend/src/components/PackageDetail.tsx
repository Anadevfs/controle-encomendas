import { useEffect, useState } from "react";

import { Package } from "@/data/mockData";
import { Camera, CheckCircle2, RefreshCw, User, Building2, Clock, Info, UserCheck, ImageIcon, Send, Phone, ClipboardList, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatPackageReceivedLabel } from "@/lib/package-datetime";

const statusConfig = {
  enviado: { label: "Entregue", bgClass: "bg-eva-green-light", textClass: "text-eva-green", borderClass: "border-eva-green/30" },
  pendente: { label: "Comunicado", bgClass: "bg-eva-warning-light", textClass: "text-eva-warning", borderClass: "border-eva-warning/30" },
  atrasado: { label: "Atrasado", bgClass: "bg-eva-danger-light", textClass: "text-eva-danger", borderClass: "border-eva-danger/30" },
};

interface PackageDetailProps {
  pkg: Package | null;
  onMarkAsSent: (pkg: Package) => void;
  onSaveObservation: (pkg: Package, observacoes: string) => void;
}

const PackageDetail = ({ pkg, onMarkAsSent, onSaveObservation }: PackageDetailProps) => {
  const [observationInput, setObservationInput] = useState("");

  useEffect(() => {
    if (!pkg) {
      setObservationInput("");
      return;
    }

    setObservationInput(pkg.observacoes ?? "");
  }, [pkg]);

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
  const hasObservationContent = observationInput.trim().length > 0;
  const hasObservationChanged = observationInput !== (pkg.observacoes ?? "");
  const canSaveObservation = hasObservationContent && hasObservationChanged;

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
          <DetailItem icon={Clock} label="Recebido" value={formatPackageReceivedLabel(pkg)} />
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
          <div className="flex items-center gap-2.5 mb-3">
            <div className="rounded-lg bg-surface-2 p-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Observacoes da Encomenda
              </p>
              <p className="text-xs text-muted-foreground">
                Registre o volume ou uma observacao operacional antes do envio.
              </p>
            </div>
          </div>

          <Textarea
            value={observationInput}
            placeholder="Ex.: 2 caixas, 1 envelope, documentos, pasta com documentos"
            className="min-h-[96px] resize-none rounded-xl border-border bg-surface-2"
            onChange={(event) => {
              setObservationInput(event.target.value);
            }}
          />

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={!canSaveObservation}
              onClick={() => onSaveObservation(pkg, observationInput)}
              className="h-8 rounded-lg px-3 text-xs font-medium"
            >
              Salvar observacao
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Rastreabilidade
          </p>
          <div className="space-y-2">
            <TraceItem icon={UserCheck} label="Recebida por" value={pkg.recebidoPor} />
            {pkg.observacoes?.trim() && (
              <TraceItem icon={ClipboardList} label="Observacoes" value={pkg.observacoes.trim()} />
            )}
            {pkg.fotoEnviadaPor && (
              <TraceItem icon={ImageIcon} label="Foto enviada por" value={pkg.fotoEnviadaPor} />
            )}
            {pkg.marcadoEnviadoPor && (
              <TraceItem icon={Send} label="Marcada enviada por" value={pkg.marcadoEnviadoPor} />
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
              {pkg.status === "enviado" ? "Encomenda entregue" : "Marcar como entregue"}
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

export default PackageDetail;
