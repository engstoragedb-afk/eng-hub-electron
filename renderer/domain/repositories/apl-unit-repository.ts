import { IAplUnit } from "../models";

export interface UpsertAplUnitPayload {
    unit_id: string;
    category_apl_id: string;
    total: number;
    vault?: number;
}

import { IRepository } from "./repository";

export interface IAplUnitRepository extends IRepository<IAplUnit> {
    upsertAplUnit(data: UpsertAplUnitPayload): Promise<IAplUnit>;
}
