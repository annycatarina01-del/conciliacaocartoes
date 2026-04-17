import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata a data para o padrão DD/MM/YYYY HH:MM.
 * Aceita datas no formato ISO (2026-04-15T13:35:00) ou já no formato
 * brasileiro (15/04/2026 13:35 ou 15/04/2026 13:35:22).
 */
export function formatDate(date: string): string {
  if (!date) return '';

  // Já está no formato DD/MM/YYYY ... — apenas garantir HH:MM no final
  if (/^\d{2}\/\d{2}\/\d{4}/.test(date)) {
    const [datePart, timePart] = date.split(' ');
    if (timePart) {
      const [hh, mm] = timePart.split(':');
      return `${datePart} ${hh}:${mm}`;
    }
    return datePart;
  }

  // Tenta converter de ISO ou outro formato reconhecível por Date
  const d = new Date(date);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  // Fallback: retorna como veio
  return date;
}
