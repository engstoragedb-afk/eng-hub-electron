import { ITypeUnit } from "@/domain/models/type-unit";

import { IRepository } from "./repository";

export interface ITypeUnitRepository extends IRepository<ITypeUnit> {
    getTypeUnits(): Promise<ITypeUnit[]>;
}
