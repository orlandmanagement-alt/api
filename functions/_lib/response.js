// Standard Response Headers
const headers = {
  "Content-Type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Fungsi dasar JSON
export const json = (data, status = 200) => {
  return new Response(JSON.stringify(data), { status, headers });
};

// Shortcut untuk sukses
export const jsonOk = (data) => json(data, 200);

// Shortcut untuk Error Umum (500)
export const jsonError = (message = "Internal Server Error", status = 500) => {
  return json({ ok: false, message }, status);
};

// Shortcut untuk Invalid Input (400)
export const jsonInvalid = (message = "Data tidak valid") => {
  return json({ ok: false, message }, 400);
};

// Shortcut untuk Unauthorized (401)
export const jsonUnauthorized = (message = "Silakan login kembali") => {
  return json({ ok: false, message }, 401);
};

// Shortcut untuk Forbidden/Banned (403)
export const jsonForbidden = (message = "Akses ditolak atau akun diblokir") => {
  return json({ ok: false, message }, 403);
};

// Shortcut untuk Not Found (404)
export const jsonNotFound = (message = "Data tidak ditemukan") => {
  return json({ ok: false, message }, 404);
};
