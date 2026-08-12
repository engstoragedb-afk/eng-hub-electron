import { IAplUnit } from "../models";
import { UpsertAplUnitPayload } from "../repositories/apl-unit-repository";

import { IService } from "./service";

export interface IAplUnitService extends IService<IAplUnit> {
    upsertAplUnit(data: UpsertAplUnitPayload): Promise<IAplUnit>;
}
