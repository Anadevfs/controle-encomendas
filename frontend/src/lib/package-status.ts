import type { Package } from "@/data/mockData";

const OVERDUE_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getEffectivePackageStatus = (
  pkg: Package,
  referenceDate = new Date()
): Package["status"] => {
  if (pkg.status === "enviado" || pkg.status === "atrasado") {
    return pkg.status;
  }

  if (!pkg.dataRecebimento) {
    return pkg.status;
  }

  const receivedDate = new Date(pkg.dataRecebimento);

  if (Number.isNaN(receivedDate.getTime())) {
    return pkg.status;
  }

  const overdueDate = new Date(receivedDate.getTime() + OVERDUE_DAYS * MS_PER_DAY);

  return referenceDate.getTime() >= overdueDate.getTime() ? "atrasado" : pkg.status;
};
