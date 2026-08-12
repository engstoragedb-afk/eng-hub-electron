import { IAuditLog } from "../models/audit-log";

import { IService } from "./service";

export interface IAuditLogService extends IService<IAuditLog> {
    getLatestLogs(limit?: number, action?: string): Promise<IAuditLog[]>;
    getAllLogs(params?: { page?: number; limit?: number; search?: string; action?: string }): Promise<{ data: IAuditLog[]; totalRow: number; page: number; limit: number }>;
}
