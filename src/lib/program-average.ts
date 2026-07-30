export function programAverage(
  first: number | null | undefined,
  second: number | null | undefined,
) {
  if (first == null) return null;
  return second == null ? first : Math.round((first + second) * 10) / 20;
}

export function formatProgramAverage(
  first: number | null | undefined,
  second: number | null | undefined,
) {
  const value = programAverage(first, second);
  if (value == null) return "–";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}
