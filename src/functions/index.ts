// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const removeEmptyValueFromObj = (obj: Record<string, any>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newObj = {} as Record<string, any>;
  Object.keys(obj).forEach((key) => {
    if (obj[key] === Object(obj[key]))
      newObj[key] = removeEmptyValueFromObj(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};
