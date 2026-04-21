import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const ELECTION_TYPE_LABELS: Record<string, string> = {
  governor: "Governador",
  senator: "Senador",
  federal_deputy: "Deputado Federal",
  state_deputy: "Deputado Estadual",
};

export const METHODOLOGY_LABELS: Record<string, string> = {
  telephone: "Telefone",
  "in-person": "Presencial",
  online: "Online",
  mixed: "Misto",
};
