import { ITypeUnit } from "@/domain/models/type-unit";

export interface ITypeUnitRepository {
    getTypeUnits(): Promise<ITypeUnit[]>;
}
