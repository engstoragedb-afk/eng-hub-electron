import { IAplUnitService } from "../domain/services/apl-unit-service";
import { IAplUnitRepository, UpsertAplUnitPayload } from "../domain/repositories/apl-unit-repository";
import { AplUnitRepository } from "../infra/http/apl-unit-repository";
import { restApi } from "../infra/http/rest-api";
import { IAplUnit } from "../domain/models/apl-unit";

export class AplUnitService implements IAplUnitService {
    private aplUnitRepo: IAplUnitRepository;

    constructor(aplUnitRepo?: IAplUnitRepository) {
        this.aplUnitRepo = aplUnitRepo || new AplUnitRepository(restApi);
    }

    async upsertAplUnit(data: UpsertAplUnitPayload): Promise<IAplUnit> {
        return this.aplUnitRepo.upsertAplUnit(data);
    }
}

export const aplUnitService = new AplUnitService();
