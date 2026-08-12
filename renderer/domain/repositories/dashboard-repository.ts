import { IDashboardStats } from "@/domain/models";

import { IRepository } from "./repository";

export interface IDashboardRepository extends IRepository<IDashboardStats> {
    getStats(): Promise<IDashboardStats[]>;
}
