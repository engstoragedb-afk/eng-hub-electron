import { ICategoryUnit } from "@/domain/models";

export interface ICategoryUnitsRepository {
    getAll(): Promise<ICategoryUnit[]>;
}
