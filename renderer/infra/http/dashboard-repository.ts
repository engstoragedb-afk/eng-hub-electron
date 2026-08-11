import { IDashboardRepository } from "@/domain/repositories/dashboard-repository";
import { IDashboardStats } from "@/domain/models";
import { RestApi } from "@/infra/http/rest-api";

export class DashboardRepository implements IDashboardRepository {
    constructor(private readonly restApi: RestApi) {}

    async getStats(): Promise<IDashboardStats[]> {
        const { data } = await this.restApi.axios.get('/dashboard/stats');
        return data.data || [];
    }
}
