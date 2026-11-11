/** Where an admin lands after signing in or opening the root URL. */
export const landingPath = (permissions: string[]): string => {
  if (permissions.includes("dashboard.read")) return "/dashboard";
  // The alumni_manager role only opens the member pages.
  if (permissions.includes("members.read")) return "/member";
  return "/my-requests";
};
