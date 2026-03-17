import { hasRole } from "../../_lib.js";
import { listUserOptions } from "../../repos/users_repo.js";

export async function listUserOptionsService(env, auth, query){
  if(!hasRole(auth.roles, ["super_admin","admin","staff"])) return { error: "forbidden", status: 403 };

  const q = String(query.q || "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(200, Number(query.limit || "100")));
  const rows = await listUserOptions(env, q, limit);

  return {
    items: rows.map(x => ({
      id: x.id,
      display_name: x.display_name || "",
      email_norm: x.email_norm || "",
      status: x.status || "",
      roles: String(x.roles || "").split(",").filter(Boolean)
    }))
  };
}
