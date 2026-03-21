import { TalentRepo } from "../../repos/talent_repo.js";

export const UsersTalentService = {
    async findTalent(db, filters) {
        const results = await TalentRepo.search(db, filters);
        return results.results;
    }
};
