import { IDashboardRepository } from "@/domain/repositories/dashboard-repository";
import { IDashboardStats } from "@/domain/models";
import { Repository } from "@/infra/http/repository";

export class DashboardRepository extends Repository<IDashboardStats> implements IDashboardRepository {
    private static instance: DashboardRepository;

    private constructor(baseUrl: string = "/dashboard") {
        super(baseUrl);
    }

    public static getInstance(): DashboardRepository {
        if (!DashboardRepository.instance) {
            DashboardRepository.instance = new DashboardRepository();
        }
        return DashboardRepository.instance;
    }

    async getStats(): Promise<IDashboardStats[]> {
        const { data } = await this.restApi.axios.get(`${this.baseUrl}/stats`);
        return data.data || [];
    }
}

export const dashboardRepository = DashboardRepository.getInstance();
