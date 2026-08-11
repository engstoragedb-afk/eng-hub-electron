import { IDashboardStats } from "@/domain/models";

export interface IDashboardRepository {
    getStats(): Promise<IDashboardStats[]>;
}
