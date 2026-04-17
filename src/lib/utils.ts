import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna a data/hora exatamente como está armazenada (formato DD/MM/YYYY HH:MM).
 * Evita qualquer conversão via objeto Date para não sofrer com problemas de timezone.
 * Para strings ISO (2026-04-17T14:35:00), converte manualmente sem usar Date.
 */
export function formatDate(date: string): string {
  if (!date) return '';

  // Já está no formato DD/MM/YYYY [HH:MM[:SS]] — retorna como está (no máximo HH:MM)
  if (/^\d{2}\/\d{2}\/\d{4}/.test(date)) {
    const [datePart, timePart] = date.split(' ');
    if (timePart) {
      const parts = timePart.split(':');
      return `${datePart} ${parts[0]}:${parts[1]}`;
    }
    return datePart;
  }

  // Formato ISO: YYYY-MM-DDTHH:MM:SS ou YYYY-MM-DD HH:MM:SS ou YYYY-MM-DD
  const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (isoMatch) {
    const [, yyyy, MM, dd, hh, min] = isoMatch;
    if (hh && min) {
      return `${dd}/${MM}/${yyyy} ${hh}:${min}`;
    }
    return `${dd}/${MM}/${yyyy}`;
  }

  // Fallback: retorna como veio
  return date;
}
