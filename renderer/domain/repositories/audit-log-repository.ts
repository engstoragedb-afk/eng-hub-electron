import { IAuditLog } from "../models/audit-log";

export interface IAuditLogRepository {
    getLatest(limit?: number, action?: string): Promise<IAuditLog[]>;
    getAll(params?: { page?: number; limit?: number; search?: string; action?: string }): Promise<{ data: IAuditLog[]; totalRow: number; page: number; limit: number }>;
}
