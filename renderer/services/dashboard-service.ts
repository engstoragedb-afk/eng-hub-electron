import { IDashboardRepository } from "@/domain/repositories/dashboard-repository";
import { IDashboardService } from "@/domain/services/dashboard-service";
import { dashboardRepository } from "@/infra/http/dashboard-repository";
import { IDashboardStats } from "@/domain/models";
import { Service } from "@/services/service";

export class DashboardService extends Service<IDashboardStats, IDashboardRepository> implements IDashboardService {
    private static instance: DashboardService;

    private constructor(repository: IDashboardRepository) {
        super(repository);
    }

    public static getInstance(repository: IDashboardRepository): DashboardService {
        if (!DashboardService.instance) {
            DashboardService.instance = new DashboardService(repository);
        }
        return DashboardService.instance;
    }

    async getStats(): Promise<IDashboardStats[]> {
        return this.repository.getStats();
    }
}

export const dashboardService = DashboardService.getInstance(dashboardRepository);
