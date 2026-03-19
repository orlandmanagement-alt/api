// Fungsi ini sama persis secara logika dengan user_unlock di skema baru kita (menghapus fail_count)
// Kita buat alias (shim) ke user_unlock.js agar kode lebih DRY
export { onRequestPost } from "./user_unlock.js";
