import { getDashboardSummary } from "../../repos/dashboard_repo.js";

function hasRole(roles, allowed) { return allowed.some(r => roles.includes(r)); }

export async function getDashboardSummaryService(env, auth) {
  if(!hasRole(auth.roles, ["super_admin", "admin", "staff"])) return { error: "forbidden", status: 403 };
  const data = await getDashboardSummary(env);
  return data;
}
