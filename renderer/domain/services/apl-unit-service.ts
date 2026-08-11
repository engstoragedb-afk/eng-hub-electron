import { IAplUnit } from "../models";
import { UpsertAplUnitPayload } from "../repositories/apl-unit-repository";

export interface IAplUnitService {
    upsertAplUnit(data: UpsertAplUnitPayload): Promise<IAplUnit>;
}
