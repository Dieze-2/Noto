// Convert input like "72,5" or "72.5" to number 72.5

export function parseDecimalFlexible(input: string): number | null {

  const s = input.trim();

  if (!s) return null;

 

  // allow comma or dot as decimal separator

  const normalized = s.replace(",", ".");

  const n = Number(normalized);

 

  if (Number.isNaN(n)) return null;

  return n;

}

 

// Format number for FR display (comma decimal separator)

export function formatKgFR(kg: number, fractionDigits: number = 1): string {

  return new Intl.NumberFormat("fr-FR", {

    minimumFractionDigits: fractionDigits,

    maximumFractionDigits: fractionDigits,

  }).format(kg);

}

 

export function gramsToKg(g: number): number {

  return g / 1000;

}

 

export function kgToGramsInt(kg: number): number {

  // store as integer grams (rounded to nearest gram)

  return Math.round(kg * 1000);

}

 