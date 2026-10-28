/** Where an admin lands after signing in or opening the root URL. */
export const landingPath = (permissions: string[]): string => {
  if (permissions.includes("dashboard.read")) return "/dashboard";
  // The p3ri role only opens the P3RI pages.
  if (permissions.includes("p3ri.registrations.read")) return "/p3ri";
  return "/my-requests";
};
