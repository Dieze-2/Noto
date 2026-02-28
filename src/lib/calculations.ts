export function calculateAverage(values: (number | null)[]): number | null {
  const filtered = values.filter((v): v is number => v !== null);
  if (filtered.length === 0) return null;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

export function calculateWeightDiff(currentAvg: number | null, prevAvg: number | null): { diff: number; percent: number } | null {
  if (currentAvg === null || prevAvg === null || prevAvg === 0) return null;
  const diff = currentAvg - prevAvg;
  const percent = (diff / prevAvg) * 100;
  return { diff, percent };
}