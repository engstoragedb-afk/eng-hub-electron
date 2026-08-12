import { IDashboardStats } from "../models";
import { IService } from "./service";

export interface IDashboardService extends IService<IDashboardStats> {
    getStats(): Promise<IDashboardStats[]>;
}
