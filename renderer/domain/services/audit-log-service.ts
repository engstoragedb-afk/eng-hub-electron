import { IAuditLog } from "../models/audit-log";

export interface IAuditLogService {
    getLatestLogs(limit?: number, action?: string): Promise<IAuditLog[]>;
}
