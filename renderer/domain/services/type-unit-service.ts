import { ITypeUnit } from "../models/type-unit";
import { IService } from "./service";

export interface ITypeUnitService extends IService<ITypeUnit> {
    getTypeUnits(): Promise<ITypeUnit[]>;
    createTypeUnit(name: string): Promise<ITypeUnit>;
}
