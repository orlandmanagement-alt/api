import { ClientRepo } from "../../repos/client_repo.js";

export const ClientMeService = {
    async getMyProfile(dbClient, userId) {
        return await ClientRepo.getProfile(dbClient, userId);
    },
    async updateMyProfile(dbClient, userId, data) {
        return await ClientRepo.upsertProfile(dbClient, userId, data);
    }
};
