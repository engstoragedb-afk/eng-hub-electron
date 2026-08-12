import { IAuditLogService } from "../domain/services/audit-log-service";
import { IAuditLogRepository } from "../domain/repositories/audit-log-repository";
import { AuditLogRepository } from "../infra/http/audit-log.repository";
import { restApi } from "../infra/http/rest-api";
import { IAuditLog } from "../domain/models/audit-log";

class AuditLogService implements IAuditLogService {
    private repository: IAuditLogRepository;

    constructor(repository: IAuditLogRepository) {
        this.repository = repository;
    }

    async getLatestLogs(limit?: number, action?: string): Promise<IAuditLog[]> {
        return this.repository.getLatest(limit, action);
    }

    async getAllLogs(params?: { page?: number; limit?: number; search?: string; action?: string }): Promise<{ data: IAuditLog[]; totalRow: number; page: number; limit: number }> {
        return this.repository.getAll(params);
    }
}

export const auditLogService = new AuditLogService(new AuditLogRepository(restApi));
