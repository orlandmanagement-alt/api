import { getAdminUsers } from "../../repos/users_repo.js";
export async function listAdminUsersService(env, auth, query) {
  if(!auth.roles.some(r => ["super_admin", "admin", "staff"].includes(r))) return { error: "forbidden", status: 403 };
  const limit = Math.min(500, Math.max(1, Number(query.limit || "100")));
  const items = await getAdminUsers(env, query.q || "", limit);
  return { items };
}
