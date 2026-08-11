import { IDashboardRepository } from "@/domain/repositories/dashboard-repository";
import { DashboardRepository } from "@/infra/http/dashboard-repository";
import { restApi } from "@/infra/http/rest-api";
import { IDashboardStats } from "@/domain/models";

export class DashboardService {
    private dashboardRepo: IDashboardRepository;

    constructor(dashboardRepo?: IDashboardRepository) {
        this.dashboardRepo = dashboardRepo || new DashboardRepository(restApi);
    }

    async getStats(): Promise<IDashboardStats[]> {
        return this.dashboardRepo.getStats();
    }
}

export const dashboardService = new DashboardService();
