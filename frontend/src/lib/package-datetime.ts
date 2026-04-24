import type { Package } from "@/data/mockData";

export const formatPackageDateTimeValue = (value: string | undefined) => {
  const directDateTimeMatch = value?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/);

  if (directDateTimeMatch) {
    const [, , month, day, time] = directDateTimeMatch;
    return {
      date: `${day}/${month}`,
      time,
    };
  }

  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    date: parsedDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
    time: parsedDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export const formatPackageReceivedLabel = (pkg: Package) => {
  const receivedDateTime = formatPackageDateTimeValue(pkg.dataRecebimento);

  if (!receivedDateTime) {
    return pkg.horario;
  }

  return `${receivedDateTime.date} ${receivedDateTime.time}`;
};

export const formatPackageScheduleLabel = (pkg: Package) => {
  const receivedLabel = formatPackageReceivedLabel(pkg);
  const deliveredDateTime = formatPackageDateTimeValue(pkg.dataEntrega);

  if (!deliveredDateTime) {
    return receivedLabel;
  }

  return `${receivedLabel} / ${deliveredDateTime.time}`;
};
