import { IAuditLogService } from "@/domain/services/audit-log-service";
import { IAuditLogRepository } from "@/domain/repositories/audit-log-repository";
import { auditLogRepository } from "@/infra/http/audit-log-repository";
import { IAuditLog } from "@/domain/models/audit-log";
import { Service } from "@/services/service";

class AuditLogService extends Service<IAuditLog, IAuditLogRepository> implements IAuditLogService {
    private static instance: AuditLogService;

    private constructor(repository: IAuditLogRepository) {
        super(repository);
    }

    public static getInstance(repository: IAuditLogRepository): AuditLogService {
        if (!AuditLogService.instance) {
            AuditLogService.instance = new AuditLogService(repository);
        }
        return AuditLogService.instance;
    }

    async getLatestLogs(limit?: number, action?: string): Promise<IAuditLog[]> {
        return this.repository.getLatest(limit, action);
    }

    async getAllLogs(params?: { page?: number; limit?: number; search?: string; action?: string; unit?: string }): Promise<{ data: IAuditLog[]; totalRow: number; page: number; limit: number }> {
        return this.repository.getAll(params);
    }

    async cleanupHistory(days: number, action?: string): Promise<any> {
        return (this.repository as any).cleanupHistory(days, action);
    }
}

export const auditLogService = AuditLogService.getInstance(auditLogRepository);
