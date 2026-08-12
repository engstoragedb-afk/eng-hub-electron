import { IAuditLogRepository } from "../../domain/repositories/audit-log-repository";
import { IAuditLog, AuditLog } from "../../domain/models/audit-log";
import { RestApi } from "@/infra/http/rest-api";

export class AuditLogRepository implements IAuditLogRepository {
    constructor(private readonly restApi: RestApi) { }

    async getLatest(limit: number = 5, action?: string): Promise<IAuditLog[]> {
        const { data } = await this.restApi.axios.get('/audit-logs/latest', { params: { limit, action } });
        const resData = data.data || data;
        return resData.map((item: any) => AuditLog.create(item).unmarshall());
    }

    async getAll(params?: { page?: number; limit?: number; search?: string; action?: string }): Promise<{ data: IAuditLog[]; totalRow: number; page: number; limit: number }> {
        const { data } = await this.restApi.axios.get('/audit-logs', { params });
        const resData = data.data?.data || data.data || [];
        const totalRow = data.data?.totalRow || 0;
        const page = data.data?.page || params?.page || 1;
        const limit = data.data?.limit || params?.limit || 10;
        
        return {
            data: resData.map((item: any) => AuditLog.create(item).unmarshall()),
            totalRow,
            page,
            limit
        };
    }
}
