import { IAplUnit } from "../models";

export interface UpsertAplUnitPayload {
    unit_id: string;
    category_apl_id: string;
    total: number;
    vault?: number;
}

export interface IAplUnitRepository {
    upsertAplUnit(data: UpsertAplUnitPayload): Promise<IAplUnit>;
}
