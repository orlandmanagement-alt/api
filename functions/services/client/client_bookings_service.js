import { ClientRepo } from "../../repos/client_repo.js";
import { WalletRepo } from "../../repos/wallet_repo.js";

export const ClientBookingService = {
    async confirmPayment(db, bookingId, userId) {
        const booking = await ClientRepo.getBooking(db, bookingId);
        if (!booking) throw new Error("Booking not found");
        
        await WalletRepo.addTransaction(db, {
            userId: userId,
            type: 'debit',
            amount: booking.total_amount,
            purpose: `Payment for Booking ${bookingId}`,
            refId: bookingId
        });

        return await ClientRepo.updateBookingStatus(db, bookingId, 'confirmed', 'paid');
    }
};
