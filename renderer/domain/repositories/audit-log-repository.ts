import { IAuditLog } from "../models/audit-log";

export interface IAuditLogRepository {
    getLatest(limit?: number, action?: string): Promise<IAuditLog[]>;
}
