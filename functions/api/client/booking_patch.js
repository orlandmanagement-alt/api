import { jsonOk, jsonError } from "../../_lib/response.js";
import { ClientBookingService } from "../../services/client/client_bookings_service.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json();
        const userId = "USER_ID_FROM_SESSION"; 
        
        await ClientBookingService.confirmPayment(env.DB, body.booking_id, userId);
        
        return jsonOk({ message: "Booking confirmed and payment processed" });
    } catch (e) {
        return jsonError(e.message);
    }
}
