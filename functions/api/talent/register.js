import { jsonError } from "../../_lib/response.js";

export async function onRequestPost() {
  return jsonError("Proses registrasi telah dipindahkan secara terpusat ke Sistem SSO (sso.orlandmanagement.com). Silakan gunakan antarmuka SSO.", 410);
}
