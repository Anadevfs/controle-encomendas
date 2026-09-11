import { describe, expect, it } from "vitest";

import type { Package } from "@/data/mockData";
import { getEffectivePackageStatus } from "@/lib/package-status";

const referenceDate = new Date("2026-09-11T12:00:00");

const makePackage = (status: Package["status"], dataRecebimento: string): Package => ({
  id: 1,
  dataRecebimento,
  cliente: "Cliente Teste",
  sala: "73-A",
  empresa: "Empresa Teste",
  horario: "12:00",
  status,
  funcionario: "Ana",
  descricao: "Encomenda de teste",
  recebidoPor: "Ana",
});

describe("getEffectivePackageStatus", () => {
  it("mantem pendente quando recebida ha 3 dias", () => {
    expect(getEffectivePackageStatus(makePackage("pendente", "2026-09-08T12:00:00"), referenceDate)).toBe(
      "pendente"
    );
  });

  it("marca como atrasada quando recebida ha 7 dias sem entrega", () => {
    expect(getEffectivePackageStatus(makePackage("pendente", "2026-09-04T12:00:00"), referenceDate)).toBe(
      "atrasado"
    );
  });

  it("marca comunicado como atrasado quando recebida ha 15 dias sem entrega", () => {
    expect(getEffectivePackageStatus(makePackage("pendente", "2026-08-27T12:00:00"), referenceDate)).toBe(
      "atrasado"
    );
  });

  it("mantem entregue quando recebida ha 20 dias", () => {
    expect(getEffectivePackageStatus(makePackage("enviado", "2026-08-22T12:00:00"), referenceDate)).toBe(
      "enviado"
    );
  });
});
