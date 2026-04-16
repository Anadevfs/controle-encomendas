export interface Package {
  id: number;
  backendId?: number;
  clientId?: number;
  origin?: "api" | "local";
  cliente: string;
  sala: string;
  empresa: string;
  horario: string;
  status: "pendente" | "enviado" | "atrasado";
  funcionario: string;
  descricao: string;
  recebidoPor: string;
  whatsapp?: string;
  codigoRastreio?: string;
  textoAuxiliar?: string;
  fotoEnviadaPor?: string;
  marcadoEnviadoPor?: string;
}

export const packages: Package[] = [
  { id: 1, cliente: "Ana Paula Silva", sala: "203", empresa: "Tech Solutions", horario: "08:15", status: "enviado", funcionario: "Carlos", descricao: "Caixa pequena - Sedex", recebidoPor: "Ana Paula", fotoEnviadaPor: "Ana Paula", marcadoEnviadoPor: "Carlos" },
  { id: 2, cliente: "Roberto Mendes", sala: "415", empresa: "Design Lab", horario: "09:32", status: "pendente", funcionario: "Maria", descricao: "Envelope A4 - Carta registrada", recebidoPor: "Maria" },
  { id: 3, cliente: "Fernanda Costa", sala: "102", empresa: "Advocacia Costa", horario: "10:05", status: "atrasado", funcionario: "João", descricao: "Pacote médio - PAC", recebidoPor: "João", fotoEnviadaPor: "João" },
  { id: 4, cliente: "Lucas Oliveira", sala: "308", empresa: "StartUp Hub", horario: "11:20", status: "pendente", funcionario: "Carlos", descricao: "Documentos - Motoboy", recebidoPor: "Carlos" },
  { id: 5, cliente: "Mariana Santos", sala: "501", empresa: "Consultoria MS", horario: "12:45", status: "enviado", funcionario: "Maria", descricao: "Caixa grande - Transportadora", recebidoPor: "Ana Paula", fotoEnviadaPor: "Maria", marcadoEnviadoPor: "Maria" },
  { id: 6, cliente: "Pedro Almeida", sala: "210", empresa: "Contábil PA", horario: "13:10", status: "pendente", funcionario: "João", descricao: "Envelope - Sedex", recebidoPor: "João" },
  { id: 7, cliente: "Juliana Ferreira", sala: "317", empresa: "JF Marketing", horario: "14:30", status: "atrasado", funcionario: "Carlos", descricao: "Pacote pequeno - PAC", recebidoPor: "Carlos", fotoEnviadaPor: "Carlos" },
  { id: 8, cliente: "André Lima", sala: "112", empresa: "Lima Engenharia", horario: "15:00", status: "enviado", funcionario: "Maria", descricao: "Tubo - Sedex", recebidoPor: "Maria", fotoEnviadaPor: "Ana Paula", marcadoEnviadoPor: "Ana Paula" },
];

export const recentEvents = [
  { time: "15:02", text: "Encomenda enviada - Sala 112 - André Lima", type: "success" as const },
  { time: "14:35", text: "Foto enviada - Cliente Juliana Ferreira", type: "info" as const },
  { time: "14:30", text: "Envio atrasado detectado - Sala 317", type: "danger" as const },
  { time: "13:15", text: "Encomenda recebida - Sala 210 - Pedro Almeida", type: "info" as const },
  { time: "12:50", text: "Encomenda enviada - Sala 501 - Mariana Santos", type: "success" as const },
  { time: "11:20", text: "Encomenda recebida - Sala 308 - Lucas Oliveira", type: "info" as const },
  { time: "10:10", text: "Envio atrasado detectado - Sala 102", type: "danger" as const },
];
