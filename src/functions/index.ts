import { ADMIN_ROLE_PERMISSION } from "../constants/permissions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const removeEmptyValueFromObj = (obj: Record<string, any>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newObj = {} as Record<string, any>;
  Object.keys(obj).forEach((key) => {
    if (!Array.isArray(obj[key]) && obj[key] === Object(obj[key]))
      newObj[key] = removeEmptyValueFromObj(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};

export const getUserRolePermission = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}").user;
  return ADMIN_ROLE_PERMISSION[user?.role as keyof typeof ADMIN_ROLE_PERMISSION];
};
