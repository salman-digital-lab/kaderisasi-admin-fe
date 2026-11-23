export const removeEmptyValueFromObj = <T extends object>(obj: T): T => {
  const newObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj) as [string, unknown][]) {
    if (!Array.isArray(value) && typeof value === "object" && value !== null)
      newObj[key] = removeEmptyValueFromObj(value);
    else if (value !== undefined) newObj[key] = value;
  }
  // Only undefined-valued keys are dropped, so the result still satisfies T.
  return newObj as T;
};

export const toSearchParams = (obj: object): URLSearchParams =>
  new URLSearchParams(
    Object.entries(removeEmptyValueFromObj(obj)).map(([key, value]) => [
      key,
      String(value),
    ]),
  );
