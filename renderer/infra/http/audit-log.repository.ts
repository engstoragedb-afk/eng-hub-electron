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
}
