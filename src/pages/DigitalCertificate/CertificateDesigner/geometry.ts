export function getBoundedGeometryValue(
  value: number | null,
  currentValue: number,
  min: number,
  max: number,
): number {
  if (value === null || !Number.isFinite(value)) return currentValue;
  return Math.min(max, Math.max(min, value));
}
