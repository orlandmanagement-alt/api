import { jsonError } from "../../_lib/response.js";

export async function onRequest() {
  return jsonError("Modul Verifikasi (OTP/Email) kini dilayani oleh Server SSO (sso.orlandmanagement.com).", 410);
}
