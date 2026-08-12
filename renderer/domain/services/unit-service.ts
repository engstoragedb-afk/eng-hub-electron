import { IUnit } from "../models";
import { IPaginatedResponse, IUnitGetParams, ICreateUnitPayload } from "../repositories/unit-repository";
import { IService } from "./service";

export interface IUnitService extends IService<IUnit> {
    getUnitDetails(id: string): Promise<IUnit>;
    getUnitsByCategory(categoryId: string, params?: IUnitGetParams): Promise<IPaginatedResponse<IUnit>>;
    getAllUnits(params?: IUnitGetParams): Promise<IUnit[]>;
    createUnit(data: ICreateUnitPayload): Promise<IUnit>;
    updateUnit(id: string, data: Partial<IUnit>): Promise<IUnit>;
}
