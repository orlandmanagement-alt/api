// Header sekarang cukup Content-Type saja. CORS diurus oleh _middleware.js
const headers = {
  "Content-Type": "application/json;charset=UTF-8"
};

export const json = (data, status = 200) => {
  return new Response(JSON.stringify(data), { status, headers });
};

export const jsonOk = (data) => json(data, 200);

export const jsonError = (message = "Internal Server Error", status = 500) => {
  return json({ ok: false, message }, status);
};

export const jsonInvalid = (message = "Data tidak valid") => {
  return json({ ok: false, message }, 400);
};

export const jsonUnauthorized = (message = "Silakan login kembali") => {
  return json({ ok: false, message }, 401);
};

export const jsonForbidden = (message = "Akses ditolak atau akun diblokir") => {
  return json({ ok: false, message }, 403);
};

export const jsonNotFound = (message = "Data tidak ditemukan") => {
  return json({ ok: false, message }, 404);
};
