import { hasRole } from "../../_lib.js";
import { getDashboardSummary } from "../../repos/dashboard_repo.js";

export async function getDashboardSummaryService(env, auth){
  if(!hasRole(auth.roles, ["super_admin", "admin", "staff", "security_admin"])){
    return { error: "forbidden", status: 403 };
  }

  return await getDashboardSummary(env);
}
