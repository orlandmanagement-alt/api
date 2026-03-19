import { jsonError } from "../../_lib/response.js";

export async function onRequest() {
  return jsonError("Sistem Keamanan, MFA, dan Riwayat Login kini dikelola secara terpusat oleh Server SSO (sso.orlandmanagement.com).", 410);
}
