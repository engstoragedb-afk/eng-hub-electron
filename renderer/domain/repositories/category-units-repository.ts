import { ICategoryUnit } from "@/domain/models";

import { IRepository } from "./repository";

export interface ICategoryUnitsRepository extends IRepository<ICategoryUnit> {
    getAll(): Promise<ICategoryUnit[]>;
}
