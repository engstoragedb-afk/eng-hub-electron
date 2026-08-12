import { IAuditLog } from "../models/audit-log";

import { IRepository } from "./repository";

export interface IAuditLogRepository extends IRepository<IAuditLog> {
    getLatest(limit?: number, action?: string): Promise<IAuditLog[]>;
    getAll(params?: { page?: number; limit?: number; search?: string; action?: string }): Promise<{ data: IAuditLog[]; totalRow: number; page: number; limit: number }>;
}
