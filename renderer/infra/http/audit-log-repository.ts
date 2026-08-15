import { IAuditLogRepository } from "@/domain/repositories/audit-log-repository";
import { IAuditLog, AuditLog } from "@/domain/models/audit-log";
import { Repository } from "@/infra/http/repository";

export class AuditLogRepository extends Repository<IAuditLog> implements IAuditLogRepository {
    private static instance: AuditLogRepository;

    private constructor(baseUrl: string = "/audit-logs") {
        super(baseUrl);
    }

    public static getInstance(): AuditLogRepository {
        if (!AuditLogRepository.instance) {
            AuditLogRepository.instance = new AuditLogRepository();
        }
        return AuditLogRepository.instance;
    }

    async getLatest(limit: number = 5, action?: string): Promise<IAuditLog[]> {
        const { data } = await this.restApi.axios.get(`${this.baseUrl}/latest`, { params: { limit, action } });
        const resData = data.data || data;
        return resData.map((item: any) => AuditLog.create(item).unmarshall());
    }

    async getAll(params?: { page?: number; limit?: number; search?: string; action?: string; unit?: string }): Promise<{ data: IAuditLog[]; totalRow: number; page: number; limit: number }> {
        const { data } = await this.restApi.axios.get(this.baseUrl, { params });
        const resData = data.data?.data || data.data || [];
        const totalRow = data.data?.totalRow || 0;
        const page = data.data?.page || params?.page || 1;
        const limit = data.data?.limit || params?.limit || 10;
        if (resData.length > 0) {
            console.log("RAW AUDIT LOG DATA:", resData[0]);
        }
        return {
            data: resData.map((item: any) => AuditLog.create(item).unmarshall()),
            totalRow,
            page,
            limit
        };
    }

    async cleanupHistory(days: number, action?: string): Promise<any> {
        const { data } = await this.restApi.axios.delete(`${this.baseUrl}/cleanup`, { params: { days, action } });
        return data;
    }
}

export const auditLogRepository = AuditLogRepository.getInstance();
