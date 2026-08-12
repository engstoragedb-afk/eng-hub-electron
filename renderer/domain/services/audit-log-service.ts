import { IAuditLog } from "../models/audit-log";

export interface IAuditLogService {
    getLatestLogs(limit?: number, action?: string): Promise<IAuditLog[]>;
    getAllLogs(params?: { page?: number; limit?: number; search?: string; action?: string }): Promise<{ data: IAuditLog[]; totalRow: number; page: number; limit: number }>;
}
