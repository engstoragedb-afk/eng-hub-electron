import { ICategoryUnit } from "../models";
import { IService } from "./service";

export interface ICategoryUnitsService extends IService<ICategoryUnit> {
    getAll(): Promise<ICategoryUnit[]>;
}
